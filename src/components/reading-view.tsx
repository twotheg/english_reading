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
  start?: number;
}

interface Sentence {
  text: string;
  start: number;
}

interface ReadingViewProps {
  passage: PassageDetail;
}

const SPEED_OPTIONS = [0.6, 0.75, 0.9, 1, 1.25, 1.5];

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
        start: match.index,
      });
    } else if (match[2]) {
      tokens.push({
        type: match[2].trim() === "" ? "space" : "punctuation",
        text: match[2],
        start: match.index,
      });
    }
  }
  return tokens;
}

// Split the passage into sentences while keeping each sentence's exact
// character offset in the original text, so word-boundary events (which
// report a charIndex relative to the sentence) can be mapped back to the
// original word tokens.
function splitSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  const regex = /[^.!?]+(?:[.!?]+|$)\s*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[0].trim().length === 0) continue;
    sentences.push({ text: match[0], start: match.index });
  }
  return sentences.length ? sentences : [{ text, start: 0 }];
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
  const sentences = useMemo(
    () => splitSentences(passage.content),
    [passage.content]
  );

  // Maps a word's character start offset (in the original passage text) to
  // its token index, so we can find which word is being spoken from a
  // SpeechSynthesis boundary event.
  const startToTokenIndex = useMemo(() => {
    const map = new Map<number, number>();
    wordTokens.forEach((t) => {
      if (t.start !== undefined && t.index !== undefined) {
        map.set(t.start, t.index);
      }
    });
    return map;
  }, [wordTokens]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [popup, setPopup] = useState<WordDefinition | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const currentWordRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const autoPlayRef = useRef(false);
  const autoSentenceIndexRef = useRef(0);
  const playbackRateRef = useRef(0.9);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

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
      speak(word, playbackRateRef.current);
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
      speak(word, playbackRateRef.current);
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

  // Auto play: read one full sentence at a time (natural prosody) while
  // highlighting the currently-spoken word via the browser's word-boundary
  // event. This avoids the robotic, word-by-word sound of speaking each
  // word as a separate utterance.
  useEffect(() => {
    if (!autoPlay) {
      stopSpeaking();
      return;
    }

    let cancelled = false;

    function playSentence(sentence: Sentence): Promise<void> {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sentence.text);
        utterance.lang = "en-US";
        utterance.rate = playbackRateRef.current;
        utterance.pitch = 1;

        utterance.onboundary = (event) => {
          if (event.name && event.name !== "word") return;
          const absoluteIndex = sentence.start + event.charIndex;
          const tokenIndex = startToTokenIndex.get(absoluteIndex);
          if (tokenIndex !== undefined) {
            setActiveIndex(tokenIndex);
            saveReadingProgress(tokenIndex);
          }
        };
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }

    async function playLoop() {
      let idx = autoSentenceIndexRef.current;
      while (autoPlayRef.current && !cancelled && idx < sentences.length) {
        await playSentence(sentences[idx]);
        idx += 1;
        autoSentenceIndexRef.current = idx;
      }
      if (!cancelled && idx >= sentences.length) {
        setAutoPlay(false);
        saveReadingProgress(wordTokens.length - 1, true);
      }
    }

    playLoop();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [autoPlay, sentences, startToTokenIndex, saveReadingProgress, wordTokens.length]);

  const toggleAutoPlay = useCallback(() => {
    if (autoPlay) {
      setAutoPlay(false);
      stopSpeaking();
    } else {
      let startSentence = 0;
      if (activeIndex !== null) {
        const activeToken = wordTokens.find((t) => t.index === activeIndex);
        if (activeToken && activeToken.start !== undefined) {
          const found = sentences.findIndex(
            (s) =>
              activeToken.start! >= s.start &&
              activeToken.start! < s.start + s.text.length
          );
          if (found >= 0) startSentence = found;
        }
      }
      autoSentenceIndexRef.current = startSentence;
      setAutoPlay(true);
    }
  }, [autoPlay, activeIndex, wordTokens, sentences]);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
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

          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            aria-label="Reading speed"
            className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-200"
          >
            {SPEED_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate.toFixed(2).replace(/0$/, "").replace(/\.$/, ".0")}x
              </option>
            ))}
          </select>

          <button
            onClick={toggleAutoPlay}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
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
        onPlay={() => popup && speak(popup.word, playbackRateRef.current)}
      />
    </div>
  );
}
