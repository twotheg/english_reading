"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPassages } from "@/lib/api";
import type { PassageMeta, PaginatedPassages } from "@/lib/types";
import { PassageListItem } from "@/components/passage-list-item";
import AdSenseBanner from "@/components/adsense-banner";
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

  // ⭐ 추가됨: 다 읽은 기사들의 ID를 기억하는 보관함
  const [readPassageIds, setReadPassageIds] = useState<Set<number>>(new Set());

  const loadMore = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPassages(slug, currentPage, 20);

        // ⭐ 추가됨: 방금 불러온 20개의 기사 중 '다 읽은 기사(isRead: true)'가 있는지 서버에 물어봅니다.
        const progressPromises = result.passages.map((p) =>
          fetch(`/api/progress?passageId=${p.id}`)
            .then((res) => res.json())
            .then((data) => ({ id: p.id, isRead: data.progress?.isRead }))
            .catch(() => ({ id: p.id, isRead: false }))
        );

        const progressResults = await Promise.all(progressPromises);
        
        // 읽은 기사 ID만 모아서 보관함(Set)에 추가합니다.
        setReadPassageIds((prev) => {
          const next = new Set(prev);
          progressResults.forEach((pr) => {
            if (pr.isRead) next.add(pr.id);
          });
          return next;
        });

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
    setReadPassageIds(new Set()); // 레벨이 바뀌면 읽음 기록 초기화
    loadMore(1);
  }, [slug, loadMore]);

  useEffect(() => {
    if (page > 1) {
      loadMore(page);
    }
  }, [page, loadMore]);

  // ⭐ 추가됨: 무한 스크롤을 위한 화면 감지기 (Intersection Observer)
  const observer = useRef<IntersectionObserver | null>(null);
  const hasMore = data ? page < data.pagination.totalPages : true;

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return; // 로딩 중에는 감지 중지
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        // 화면에 마지막 요소가 보이고, 아직 불러올 데이터가 남았다면 다음 페이지 호출
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("이 기사를 목록에서 삭제하시겠습니까?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/passages/${id}`, { method: "DELETE" });
      if (res.ok) {
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

  return (
    <main className="flex min-h-screen flex-col pb-24 relative">
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
          {passages.map((passage, index) => {
            const isRead = readPassageIds.has(passage.id);
            const isLastElement = index === passages.length - 1;

            return (
              <div 
                key={passage.id} 
                ref={isLastElement ? lastElementRef : null} // ⭐ 목록의 맨 마지막 요소에 감지기를 답니다
                className={`relative flex items-center gap-2 transition-all duration-300 ${
                  isRead ? "opacity-40 grayscale" : "" // ⭐ 다 읽은 기사는 투명해지고 흑백 처리됩니다
                }`}
              >
                <div className="flex-1 min-w-0">
                  <PassageListItem passage={passage} />
                </div>
                {slug === "advanced" && (
                  <button
                    onClick={(e) => handleDelete(e, passage.id)}
                    disabled={deletingId === passage.id}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400 active:scale-95 disabled:opacity-50"
                    title="기사 삭제"
                  >
                    {deletingId === passage.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {/* 첫 로딩 시 스피너 */}
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

          {/* ⭐ 버튼 대신 추가 데이터를 불러올 때 뜨는 스피너 (무한 스크롤용) */}
          {loading && passages.length > 0 && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950 border-t border-slate-800 flex justify-center items-center h-[70px]">
        <div className="mx-auto w-full max-w-2xl px-2">
          <AdSenseBanner dataAdSlot="6277737886" />
        </div>
      </div>
    </main>
  );
}
