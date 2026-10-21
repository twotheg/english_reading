"use client";

import { useEffect, useRef } from "react";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);

  useEffect(() => {
    // 1. 페이지 접속 시 기존에 멈췄던 스크롤 위치를 서버에서 불러와 이동시킵니다.
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?passageId=${passageId}`);
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

    // 2. 유저가 스크롤을 멈추면 2초 뒤에 위치를 서버에 조용히 저장합니다.
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (!isRestored.current) return; 

      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const currentScroll = Math.round(window.scrollY);
        // 화면 맨 밑바닥에 도달했는지 계산 (다 읽었는지 판단)
        const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
        
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passageId,
            scrollPosition: currentScroll,
            isRead: isBottom, // 바닥에 닿으면 true(읽음 완료)로 저장
          }),
        });
      }, 2000); 
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [passageId]);

  return null; // 백그라운드에서만 동작하므로 화면에 그리는 것은 없습니다.
}
