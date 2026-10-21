"use client";

import { useEffect, useRef } from "react";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);
  const hasReachedBottom = useRef(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?passageId=${passageId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            if (data.progress.isRead) hasReachedBottom.current = true;
            if (data.progress.scrollPosition > 0) {
              setTimeout(() => {
                window.scrollTo({ top: data.progress.scrollPosition, behavior: "smooth" });
              }, 500);
            }
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
      // 바닥에 닿았는지 판별 (끝까지 읽음)
      const isBottom = (currentScroll + clientHeight >= scrollHeight - 150) || (scrollHeight <= clientHeight + 50);

      if (isBottom) {
        hasReachedBottom.current = true;
      }

      // ⭐ 핵심 방어막: 스크롤을 움직이지 않았다면 서버에 신호를 절대 보내지 않음! (401 에러 및 디도스 차단)
      if (currentScroll === lastSavedScroll.current) return;

      lastSavedScroll.current = currentScroll;

      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            passageId, 
            scrollPosition: currentScroll, 
            isRead: hasReachedBottom.current 
          }),
        });
      } catch (error) {
        // 실패 시 조용히 무시 (다음 3초 뒤에 다시 시도)
      }
    }, 3000); // 정확히 3초에 1번만 확인하도록 제어

    // ⭐ 무한 폭격 누수를 막는 가장 중요한 청소(Cleanup) 코드
    return () => clearInterval(intervalId);
  }, [passageId]);

  return null;
}
