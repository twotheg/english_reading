"use client";

import { useEffect, useRef } from "react";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);
  const hasReachedBottom = useRef(false); // ⭐ 끝까지 읽었는지 절대 까먹지 않는 기억 장치

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?passageId=${passageId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            // 이전에 읽었던 글이면 상태 복원
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
      const isBottom = (currentScroll + clientHeight >= scrollHeight - 150) || (scrollHeight <= clientHeight + 50);

      // ⭐ 한 번이라도 바닥에 닿으면 스크롤을 다시 올려도 무조건 true 유지
      if (isBottom) {
        hasReachedBottom.current = true;
      }

      // ⭐ 스크롤이 이전과 1픽셀도 변하지 않았다면 전송 중지 (401 에러 및 서버 폭격 완벽 차단)
      if (currentScroll === lastSavedScroll.current) return;

      lastSavedScroll.current = currentScroll;

      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            passageId, 
            scrollPosition: currentScroll, 
            isRead: hasReachedBottom.current // 무조건 true 또는 false가 안전하게 전송됨
          }),
        });
      } catch (error) {
        // 무시
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [passageId]);

  return null;
}
