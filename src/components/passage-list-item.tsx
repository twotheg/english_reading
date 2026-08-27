"use client";

import { useRouter } from "next/navigation";
import type { PassageMeta } from "@/lib/types";
import { Clock, BookText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PassageListItemProps {
  passage: PassageMeta;
}

export function PassageListItem({ passage }: PassageListItemProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/read/${passage.id}`)}
      className={cn(
        "w-full text-left rounded-xl p-4 transition-transform active:scale-[0.98]",
        "bg-slate-900 border border-slate-800 shadow flex flex-col gap-2"
      )}
      style={{ borderLeftWidth: "4px", borderLeftColor: passage.levelColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            #{passage.orderIndex}
          </span>
          <h3 className="mt-0.5 text-base font-semibold text-slate-100">
            {passage.title}
          </h3>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {passage.durationMinutes} min
        </span>
        <span className="flex items-center gap-1">
          <BookText className="h-3.5 w-3.5" />
          {passage.wordCount.toLocaleString()} words
        </span>
      </div>
    </button>
  );
}
