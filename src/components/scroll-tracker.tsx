"use client";

import { useEffect, useRef } from "react";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?passageId=${passageId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.progress?.scrollPosition && data.progress.scrollPosition > 0) {
            // ⭐ 핵심: 화면에 기사 글씨가 그려질 시간을 0.5초 벌어줍니다.
            setTimeout(() => {
              window.scrollTo({ top: data.progress.scrollPosition, behavior: "smooth" });
            }, 500);
          }
        }
      } catch (e) {
        console.error("Progress load error", e);
      } finally {
        isRestored.current = true;
      }
    };

    fetchProgress();

    const intervalId = setInterval(async () => {
      if (!isRestored.current) return;

      const currentScroll = Math.round(window.scrollY);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isBottom = (currentScroll + clientHeight >= scrollHeight - 150) || (scrollHeight <= clientHeight + 50);

      if (currentScroll !== lastSavedScroll.current || isBottom) {
        lastSavedScroll.current = currentScroll;
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passageId, scrollPosition: currentScroll, isRead: isBottom }),
        });
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [passageId]);

  return null;
}
