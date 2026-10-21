"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPassages } from "@/lib/api";
import type { PassageMeta, PaginatedPassages } from "@/lib/types";
import { PassageListItem } from "@/components/passage-list-item";
import AdSenseBanner from "@/components/adsense-banner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // ⭐ 추가됨: 클라이언트에서 토큰을 가져오기 위함

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
  const [readPassageIds, setReadPassageIds] = useState<Set<number>>(new Set());

  const loadMore = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPassages(slug, currentPage, 20);

        const ids = result.passages.map(p => p.id).join(',');
        if (ids) {
          try {
            // ⭐ 핵심: 서비스 워커의 악성 캐시를 뚫고 강력한 토큰을 직접 전송합니다.
            const supabase = createClient();
            const { data: authData } = await supabase.auth.getSession();
            const token = authData.session?.access_token || "";

            // 시간표(&t=...)를 붙여서 항상 새로운 요청인 것처럼 속입니다.
            const progressRes = await fetch(`/api/progress?passageIds=${ids}&t=${Date.now()}`, { 
              headers: {
                "Authorization": `Bearer ${token}`
              },
              cache: "no-store" 
            });
            
            if (progressRes.ok) {
              const { progresses } = await progressRes.json();
              setReadPassageIds((prev) => {
                const next = new Set(prev);
                progresses?.forEach((pr: any) => {
                  if (pr.isRead) next.add(pr.passageId);
                });
                return next;
              });
            }
          } catch (err) {
            console.error("Progress fetch error:", err);
          }
        }

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
    setReadPassageIds(new Set()); 
    loadMore(1);
  }, [slug, loadMore]);

  useEffect(() => {
    if (page > 1) {
      loadMore(page);
    }
  }, [page, loadMore]);

  const observer = useRef<IntersectionObserver | null>(null);
  const hasMore = data ? page < data.pagination.totalPages : true;

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return; 
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
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
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col pb-24 relative">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.push("/")} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-transform active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold capitalize text-slate-50">{slug} Level</h1>
            <p className="text-xs text-slate-400">{data?.pagination.total ?? "..."} passages</p>
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
                ref={isLastElement ? lastElementRef : null} 
                className={`relative flex items-center gap-2 transition-all duration-300 ${
                  isRead ? "opacity-40 grayscale" : "" 
                }`}
              >
                <div className="flex-1 min-w-0">
                  <PassageListItem passage={passage} />
                </div>
                {slug === "advanced" && (
                  <button onClick={(e) => handleDelete(e, passage.id)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400">
                    {deletingId === passage.id ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            );
          })}
          {loading && passages.length === 0 && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}
          {loading && passages.length > 0 && <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>}
        </div>
      </section>
    </main>
  );
}
