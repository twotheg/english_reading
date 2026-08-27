import type {
  Level,
  PaginatedPassages,
  PassageDetail,
  WordDefinition,
} from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchLevels(): Promise<Level[]> {
  return fetchJson<Level[]>("/api/levels");
}

export function fetchPassages(
  levelSlug: string,
  page = 1,
  limit = 20
): Promise<PaginatedPassages> {
  return fetchJson<PaginatedPassages>(
    `/api/passages?level=${encodeURIComponent(levelSlug)}&page=${page}&limit=${limit}`
  );
}

export function fetchPassage(id: number): Promise<PassageDetail> {
  return fetchJson<PassageDetail>(`/api/passages/${id}`);
}

export function fetchDefinition(word: string): Promise<WordDefinition> {
  return fetchJson<WordDefinition>(
    `/api/dictionary?word=${encodeURIComponent(word)}`
  );
}
