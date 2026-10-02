"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPassages } from "@/lib/api";
import type { PassageMeta, PaginatedPassages } from "@/lib/types";
import { PassageListItem } from "@/components/passage-list-item";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LevelPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedPassages | null>(null);
  const [passages, setPassages] = useState<PassageMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // [수정 핵심] 의존성 배열에서 loading을 제거하여 무한 루프와 상태 꼬임을 방지합니다.
  const loadMore = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPassages(slug, currentPage, 20);
      setData(result);
      setPassages((prev) =>
        currentPage === 1 ? result.passages : [...prev, ...result.passages]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // slug가 바뀔 때(초급->중급 등) 초기화하고 1페이지를 불러옵니다.
  useEffect(() => {
    setPage(1);
    setPassages([]);
    loadMore(1);
  }, [slug, loadMore]);

  // [수정 핵심] page 번호가 1보다 클 때(즉, Load more 버튼을 눌렀을 때)만 데이터를 추가로 불러옵니다.
  useEffect(() => {
    if (page > 1) {
      loadMore(page);
    }
  }, [page, loadMore]);

  const hasMore = data ? page < data.pagination.totalPages : true;

  return (
    // 하단 광고 영역(AdMob)이 버튼을 가리지 않도록 pb-20 추가
    <main className="flex min-h-screen flex-col pb-20">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-transform active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold capitalize text-slate-50">
              {slug} Level
            </h1>
            <p className="text-xs text-slate-400">
              {data?.pagination.total ?? "..."} passages
            </p>
          </div>
        </div>
      </header>

      <section className="flex-1 px-5 py-5">
        <div className="mx-auto max-w-2xl space-y-3">
          {passages.map((passage) => (
            <PassageListItem key={passage.id} passage={passage} />
          ))}

          {loading && passages.length === 0 && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-900/20 p-4 text-center text-sm text-red-200">
              {error}
            </div>
          )}

          {passages.length > 0 && hasMore && (
            <button
              onClick={() => {
                if (!loading) setPage((p) => p + 1);
              }}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-200 transition-colors active:bg-slate-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load more"
              )}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
