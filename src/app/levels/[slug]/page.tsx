"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPassages } from "@/lib/api";
import type { PassageMeta, PaginatedPassages } from "@/lib/types";
import { PassageListItem } from "@/components/passage-list-item";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

export default function LevelPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedPassages | null>(null);
  const [passages, setPassages] = useState<PassageMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 데이터 로드
  const loadMore = useCallback(
    async (currentPage: number) => {
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
    },
    [slug]
  );

  useEffect(() => {
    setPage(1);
    setPassages([]);
    loadMore(1);
  }, [slug, loadMore]);

  useEffect(() => {
    if (page > 1) {
      loadMore(page);
    }
  }, [page, loadMore]);

  // [Advanced 전용] 기사 개별 삭제 처리 함수
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("이 기사를 목록에서 삭제하시겠습니까?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/passages/${id}`, { method: "DELETE" });
      if (res.ok) {
        // UI에서 즉시 제거 및 개수 차감
        setPassages((prev) => prev.filter((p) => p.id !== id));
        setData((prev) =>
          prev
            ? {
                ...prev,
                pagination: {
                  ...prev.pagination,
                  total: Math.max(0, prev.pagination.total - 1),
                },
              }
            : null
        );
      } else {
        alert("기사 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const hasMore = data ? page < data.pagination.totalPages : true;

  return (
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
            <div key={passage.id} className="relative flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <PassageListItem passage={passage} />
              </div>

              {/* slug가 'advanced'일 때만 휴지통 삭제 버튼을 노출합니다 */}
              {slug === "advanced" && (
                <button
                  onClick={(e) => handleDelete(e, passage.id)}
                  disabled={deletingId === passage.id}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400 active:scale-95 disabled:opacity-50"
                  title="기사 삭제"
                  aria-label="Delete passage"
                >
                  {deletingId === passage.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
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
