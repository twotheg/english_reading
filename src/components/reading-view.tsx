"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { PassageDetail, WordDefinition } from "@/lib/types";
import { normalizeWord, cn } from "@/lib/utils";
import { fetchDefinition } from "@/lib/api";
import { cacheDefinition, getCachedDefinition, saveProgress } from "@/lib/cache";
import { WordPopup } from "./word-popup";
import { Play, Pause, Volume2 } from "lucide-react";

interface Token {
  type: "word" | "punctuation" | "space";
  text: string;
  word?: string;
  index?: number;
}

interface ReadingViewProps {
  passage: PassageDetail;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /([a-zA-Z0-9']+)|([^a-zA-Z0-9']+)/g;
  let match;
  let wordIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({
        type: "word",
        text: match[1],
        word: normalizeWord(match[1]),
        index: wordIndex++,
      });
    } else if (match[2]) {
      tokens.push({
        type: match[2].trim() === "" ? "space" : "punctuation",
        text: match[2],
      });
    }
  }
  return tokens;
}

function speak(text: string, rate = 0.9) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function vibrate(pattern: number | number[] = 15) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function ReadingView({ passage }: ReadingViewProps) {
  const tokens = useMemo(() => tokenize(passage.content), [passage.content]);
  const wordTokens = useMemo(
    () => tokens.filter((t) => t.type === "word"),
    [tokens]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [popup, setPopup] = useState<WordDefinition | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const currentWordRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const autoPlayRef = useRef(false);
  const autoIndexRef = useRef(0);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  const saveReadingProgress = useCallback(
    (index: number, completed = false) => {
      saveProgress({
        passageId: passage.id,
        lastWordIndex: index,
        completed,
        updatedAt: new Date().toISOString(),
      });
    },
    [passage.id]
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const openDefinition = useCallback(async (word: string) => {
    setPopupLoading(true);
    setPopup({ word, normalized: normalizeWord(word) });
    try {
      const cached = await getCachedDefinition(word);
      if (cached) {
        setPopup(cached);
        setPopupLoading(false);
        speak(cached.word);
        return;
      }
      const def = await fetchDefinition(word);
      setPopup(def);
      await cacheDefinition(def);
      speak(def.word);
    } catch (err) {
      setPopup({
        word,
        normalized: normalizeWord(word),
        definitions: ["Definition not available. Try another word."],
      });
    } finally {
      setPopupLoading(false);
    }
  }, []);

  const handleWordEnter = useCallback(
    (word: string, index: number) => {
      if (currentWordRef.current === word) return;
      currentWordRef.current = word;
      setActiveIndex(index);
      speak(word, 0.95);
      clearLongPress();
    },
    [clearLongPress]
  );

  const startLongPress = useCallback(
    (word: string) => {
      clearLongPress();
      longPressTimer.current = window.setTimeout(() => {
        vibrate([30, 30]);
        openDefinition(word);
      }, 600);
    },
    [clearLongPress, openDefinition]
  );

  const getWordFromPoint = useCallback(
    (clientX: number, clientY: number): { word: string; index: number } | null => {
      if (!containerRef.current) return null;
      const element = document.elementFromPoint(clientX, clientY);
      if (!element) return null;
      const span = element.closest("[data-word]") as HTMLElement | null;
      if (!span || !span.dataset.word || span.dataset.index === undefined) return null;
      return { word: span.dataset.word, index: parseInt(span.dataset.index, 10) };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = false;
      const result = getWordFromPoint(e.clientX, e.clientY);
      if (!result) return;
      handleWordEnter(result.word, result.index);
      startLongPress(result.word);
    },
    [getWordFromPoint, handleWordEnter, startLongPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = true;
      const result = getWordFromPoint(e.clientX, e.clientY);
      if (!result) return;
      handleWordEnter(result.word, result.index);
    },
    [getWordFromPoint, handleWordEnter]
  );

  const handlePointerUp = useCallback(() => {
    clearLongPress();
    isDraggingRef.current = false;
    if (activeIndex !== null) {
      saveReadingProgress(activeIndex);
    }
  }, [activeIndex, clearLongPress, saveReadingProgress]);

  const handleWordClick = useCallback(
    (e: React.MouseEvent, word: string, index: number) => {
      e.stopPropagation();
      if (isDraggingRef.current) return;
      setActiveIndex(index);
      speak(word, 0.95);
      saveReadingProgress(index);
    },
    [saveReadingProgress]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
      clearLongPress();
    };
  }, [clearLongPress]);

  // Auto play through words
  useEffect(() => {
    if (!autoPlay) {
      stopSpeaking();
      return;
    }

    let cancelled = false;
    async function playLoop() {
      while (autoPlayRef.current && !cancelled) {
        const idx = autoIndexRef.current;
        const token = wordTokens[idx];
        if (!token || !token.word) {
          setAutoPlay(false);
          saveReadingProgress(wordTokens.length - 1, true);
          return;
        }
        setActiveIndex(token.index!);
        currentWordRef.current = token.word;
        await new Promise<void>((resolve) => {
          const utterance = speak(token.word!, 0.9);
          if (!utterance) {
            resolve();
            return;
          }
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          setTimeout(() => resolve(), 2000);
        });
        autoIndexRef.current = idx + 1;
        saveReadingProgress(token.index!);
      }
    }
    playLoop();
    return () => {
      cancelled = true;
    };
  }, [autoPlay, wordTokens, saveReadingProgress]);

  const toggleAutoPlay = useCallback(() => {
    if (autoPlay) {
      setAutoPlay(false);
      stopSpeaking();
    } else {
      autoIndexRef.current =
        activeIndex !== null
          ? wordTokens.findIndex((t) => t.index === activeIndex)
          : 0;
      if (autoIndexRef.current < 0) autoIndexRef.current = 0;
      setAutoPlay(true);
    }
  }, [autoPlay, activeIndex, wordTokens]);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: passage.levelColor }}
            >
              {passage.levelName}
            </p>
            <h1 className="truncate text-lg font-bold text-slate-50">
              {passage.title}
            </h1>
          </div>
          <button
            onClick={toggleAutoPlay}
            className={cn(
              "ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              autoPlay
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300"
            )}
            aria-label={autoPlay ? "Pause" : "Auto play"}
          >
            {autoPlay ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="no-select flex-1 overflow-y-auto px-5 py-6"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <article className="mx-auto max-w-2xl text-lg leading-loose text-slate-200">
          {tokens.map((token, i) => {
            if (token.type !== "word") {
              return (
                <span key={i} className="text-slate-400">
                  {token.text}
                </span>
              );
            }
            const isActive = activeIndex === token.index;
            return (
              <span
                key={i}
                data-word={token.word}
                data-index={token.index}
                onClick={(e) =>
                  token.word && handleWordClick(e, token.word, token.index!)
                }
                className={cn(
                  "reading-word inline",
                  isActive && "active rounded"
                )}
              >
                {token.text}
              </span>
            );
          })}
        </article>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 px-4 py-2 text-center text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          Drag across words to listen. Long press a word for meaning.
        </span>
      </div>

      <WordPopup
        definition={popup}
        loading={popupLoading}
        onClose={() => setPopup(null)}
        onPlay={() => popup && speak(popup.word)}
      />
    </div>
  );
}
