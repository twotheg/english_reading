"use client";

import { useRouter } from "next/navigation";
import type { Level } from "@/lib/types";
import { Sprout, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  sprout: Sprout,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
};

interface LevelCardProps {
  level: Level;
}

export function LevelCard({ level }: LevelCardProps) {
  const router = useRouter();
  const Icon = iconMap[level.icon] || BookOpen;

  return (
    <button
      onClick={() => router.push(`/levels/${level.slug}`)}
      className={cn(
        "w-full text-left rounded-2xl p-5 transition-transform active:scale-[0.98]",
        "bg-slate-900 border border-slate-800 shadow-lg flex items-center gap-4"
      )}
      style={{ borderLeftWidth: "6px", borderLeftColor: level.color }}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${level.color}20` }}
      >
        <Icon className="h-7 w-7" style={{ color: level.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-slate-50">{level.name}</h2>
        <p className="mt-0.5 text-sm text-slate-400 line-clamp-2">
          {level.description}
        </p>
        <p className="mt-1.5 text-xs font-medium" style={{ color: level.color }}>
          {level.passageCount ?? 0} passages
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
    </button>
  );
}
