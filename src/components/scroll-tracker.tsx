"use client";

import { useEffect, useRef } from "react";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);

  useEffect(() => {
    // 1. 페이지 접속 시 기존 스크롤 위치 복구 (캐시 무시)
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?passageId=${passageId}`, { 
          cache: "no-store" // ⭐ 무조건 최신 데이터를 가져오도록 강제합니다.
        });
        if (res.ok) {
          const data = await res.json();
          if (data.progress?.scrollPosition && data.progress.scrollPosition > 0) {
            window.scrollTo({ top: data.progress.scrollPosition, behavior: "smooth" });
          }
        }
      } catch (e) {
        console.error("Progress load error", e);
      } finally {
        isRestored.current = true;
      }
    };

    fetchProgress();

    // 2. 3초마다 현재 위치 자동 저장 (회원님이 처음에 기획하신 완벽한 방식!)
    const intervalId = setInterval(async () => {
      if (!isRestored.current) return;

      const currentScroll = Math.round(window.scrollY);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // ⭐ 오차 범위를 넉넉하게 잡고, 글이 너무 짧아 스크롤이 아예 없는 경우도 다 읽은 것으로 간주합니다.
      const isBottom = 
        (currentScroll + clientHeight >= scrollHeight - 150) || 
        (scrollHeight <= clientHeight + 50);

      // 스크롤이 움직였거나, 바닥에 닿았을 때만 서버에 전송합니다.
      if (currentScroll !== lastSavedScroll.current || isBottom) {
        lastSavedScroll.current = currentScroll;

        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passageId,
            scrollPosition: currentScroll,
            isRead: isBottom,
          }),
        });
      }
    }, 3000); // 3초마다 조용히 실행

    return () => clearInterval(intervalId);
  }, [passageId]);

  return null;
}
