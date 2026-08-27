import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^a-zA-Z0-9']+/, "")
    .replace(/[^a-zA-Z0-9']+$/, "");
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}
