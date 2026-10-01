"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import type { PassageDetail, WordDefinition } from "@/lib/types";
import { normalizeWord, cn } from "@/lib/utils";
import { fetchDefinition } from "@/lib/api";
import { cacheDefinition, getCachedDefinition, saveProgress } from "@/lib/cache";
import { WordPopup } from "./word-popup";
import { Play, Pause, Volume2, ArrowLeft, Image as ImageIcon } from "lucide-react";

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
  const router = useRouter();
  
  const cleanTitle = passage.title.replace(/^\d+\.\s*/, '');
  const imageFilename = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';

  const tokens = useMemo(() => tokenize(passage.content), [passage.content]);
  const wordTokens = useMemo(
    () => tokens.filter((t) => t.type === "word"),
    [tokens]
  );
  const sentences = useMemo(
    () => splitSentences(passage.content),
    [passage.content]
  );

  const sentenceTokens = useMemo(() => {
    return sentences.map((s) => {
      const sEnd = s.start + s.text.length;
      return tokens.filter(
        (t) => t.start !== undefined && t.start >= s.start && t.start < sEnd
      );
    });
  }, [sentences, tokens]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const activeSentenceIndex = useMemo(() => {
    if (activeIndex === null) return null;
    const activeToken = wordTokens.find((t) => t.index === activeIndex);
    if (!activeToken || activeToken.start === undefined) return null;
    return sentences.findIndex(
      (s) =>
        activeToken.start! >= s.start &&
        activeToken.start! < s.start + s.text.length
    );
  }, [activeIndex, wordTokens, sentences]);

  const [popup, setPopup] = useState<WordDefinition | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);
  
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);
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

  useEffect(() => {
    if (activeSentenceIndex !== null && sentenceRefs.current[activeSentenceIndex]) {
      sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSentenceIndex]);

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

  // [수정 핵심] 단어를 클릭하면 기존처럼 소리만 나는 게 아니라, 바로 뜻풀이 창이 뜨도록 수정!
  const handleWordClick = useCallback(
    (e: React.MouseEvent, word: string, index: number) => {
      e.stopPropagation();
      if (isDraggingRef.current) return;
      setActiveIndex(index);
      
      // 단어를 톡 클릭하면 바로 뜻풀이 팝업이 뜨고 팝업 안에서 소리가 납니다.
      openDefinition(word);
      
      saveReadingProgress(index);
    },
    [saveReadingProgress, openDefinition]
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
      // 화면 터치 시 소리 내어 읽기
      if (currentWordRef.current !== result.word) {
        currentWordRef.current = result.word;
        setActiveIndex(result.index);
        speak(result.word, playbackRateRef.current);
      }
      startLongPress(result.word);
    },
    [getWordFromPoint, startLongPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = true;
      const result = getWordFromPoint(e.clientX, e.clientY);
      if (!result) return;
      if (currentWordRef.current !== result.word) {
        currentWordRef.current = result.word;
        setActiveIndex(result.index);
        speak(result.word, playbackRateRef.current);
      }
    },
    [getWordFromPoint]
  );

  // [수정 핵심] 드래그가 끝날 때 발생하던 클릭 오작동 방지
  const handlePointerUp = useCallback(() => {
    clearLongPress();
    
    // 드래그가 끝난 직후 클릭 이벤트가 실행되는 것을 막기 위해 0.1초 여유를 둠
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);

    if (activeIndex !== null) {
      saveReadingProgress(activeIndex);
    }
  }, [activeIndex, clearLongPress, saveReadingProgress]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      clearLongPress();
    };
  }, [clearLongPress]);

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
        
        const firstToken = wordTokens.find(t => t.start !== undefined && t.start >= sentence.start);
        if (firstToken?.index !== undefined) {
          setActiveIndex(firstToken.index);
        }

        const utterance = new SpeechSynthesisUtterance(sentence.text);
        utterance.lang = "en-US";
        utterance.rate = playbackRateRef.current;
        utterance.pitch = 1;

        utterance.onboundary = (event) => {
          if (event.name && event.name !== "word") return;
          const absoluteIndex = sentence.start + event.charIndex;
          
          const token = wordTokens.find(
            (t) => t.start !== undefined && 
                   absoluteIndex >= t.start && 
                   absoluteIndex <= t.start + t.text.length
          );
          
          if (token && token.index !== undefined) {
            setActiveIndex(token.index);
            saveReadingProgress(token.index);
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
  }, [autoPlay, sentences, wordTokens, saveReadingProgress]);

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
    <div className="flex flex-col h-[calc(100vh-60px)] pb-20">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: passage.levelColor }}
            >
              {passage.levelName}
            </p>
            <h1 className="truncate text-lg font-bold text-slate-50">
              {cleanTitle}
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
              autoPlay ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
            )}
            aria-label={autoPlay ? "Pause" : "Auto play"}
          >
            {autoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="no-select flex-1 overflow-y-auto px-5 py-6 scroll-smooth"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <article className="mx-auto max-w-2xl text-lg leading-loose text-slate-200">
          
          {passage.levelName.toLowerCase() === 'beginner' && (
            <div className="w-full h-48 sm:h-64 bg-slate-800/50 rounded-xl mb-6 flex flex-col items-center justify-center text-slate-500 border border-slate-700/50 overflow-hidden relative">
              {!imageError ? (
                <img
                  src={`/images/${imageFilename}`}
                  alt={cleanTitle}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-sm font-medium">Story Image Space</span>
                </>
              )}
            </div>
          )}

          {sentenceTokens.map((sTokens, sIdx) => {
            const isActiveSentence = sIdx === activeSentenceIndex;
            return (
              <span
                key={sIdx}
                ref={(el) => {
                  sentenceRefs.current[sIdx] = el;
                }}
                className={cn(
                  "transition-all duration-300 inline rounded-lg px-2",
                  isActiveSentence ? "bg-slate-700 shadow-md text-white py-1 my-1 block" : ""
                )}
              >
                {sTokens.map((token, i) => {
                  if (token.type !== "word") {
                    return (
                      <span key={i} className={cn("text-slate-400", isActiveSentence && "text-slate-300")}>
                        {token.text}
                      </span>
                    );
                  }
                  const isActiveWord = activeIndex === token.index;
                  return (
                    <span
                      key={i}
                      data-word={token.word}
                      data-index={token.index}
                      onClick={(e) =>
                        token.word && handleWordClick(e, token.word, token.index!)
                      }
                      className={cn(
                        "reading-word inline transition-colors duration-200 cursor-pointer",
                        isActiveWord && "text-blue-400 font-bold" 
                      )}
                    >
                      {token.text}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </article>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 px-4 py-2 text-center text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          {/* 사용자가 헷갈리지 않도록 안내 문구도 변경했습니다 */}
          Tap a word for meaning. Drag across words to listen.
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

