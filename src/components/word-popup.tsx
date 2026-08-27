"use client";

import { Volume2, X, Loader2 } from "lucide-react";
import type { WordDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WordPopupProps {
  definition: WordDefinition | null;
  loading: boolean;
  onClose: () => void;
  onPlay: () => void;
}

export function WordPopup({ definition, loading, onClose, onPlay }: WordPopupProps) {
  if (!definition) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-t-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl",
          "sm:rounded-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-slate-50">{definition.word}</h2>
            {definition.pronunciation && (
              <p className="mt-1 font-mono text-sm text-slate-400">
                {definition.pronunciation}
              </p>
            )}
            {definition.partOfSpeech && (
              <p className="mt-1 text-xs font-medium text-blue-400">
                {definition.partOfSpeech}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform active:scale-95"
              aria-label="Play pronunciation"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-transform active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-[80px]">
          {loading ? (
            <div className="flex h-20 items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading definition...</span>
            </div>
          ) : definition.definitions && definition.definitions.length > 0 ? (
            <ul className="space-y-2">
              {definition.definitions.map((def, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{def}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No definitions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
