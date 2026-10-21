"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);
  const hasReachedBottom = useRef(false);
  const currentScrollRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();

    const getAuthHeaders = async () => {
      const { data } = await supabase.auth.getSession();
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.session?.access_token || ""}`
      };
    };

    // ⭐ 1. 스크롤 복원: 전체 화면이든 내부 박스든 무조건 찾아내서 스크롤을 꽂아버립니다.
    const restorePosition = (targetPos: number) => {
      // 일반 창 스크롤 시도
      window.scrollTo({ top: targetPos, behavior: "auto" });
      
      // 내부 박스 스크롤 시도 (글을 담고 있는 div들을 샅샅이 뒤집니다)
      const divs = document.querySelectorAll("div, main, section");
      divs.forEach((el) => {
        if (el.scrollHeight > el.clientHeight) {
          const overflowY = window.getComputedStyle(el).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            el.scrollTop = targetPos;
          }
        }
      });
    };

    const fetchProgress = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/progress?passageId=${passageId}&t=${Date.now()}`, { 
          headers,
          cache: "no-store" 
        });
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            if (data.progress.isRead) hasReachedBottom.current = true;
            if (data.progress.scrollPosition > 0) {
              // 화면이 그려지는 속도를 고려해 3번 연속으로 확실하게 쐐기를 박아줍니다!
              setTimeout(() => restorePosition(data.progress.scrollPosition), 300);
              setTimeout(() => restorePosition(data.progress.scrollPosition), 800);
              setTimeout(() => restorePosition(data.progress.scrollPosition), 1500);
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

    // ⭐ 2. 캡처(capture) 모드: 내부 박스의 몰래 스크롤도 강제로 잡아냅니다.
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (target instanceof Document) {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        const el = target as HTMLElement;
        scrollTop = el.scrollTop;
        scrollHeight = el.scrollHeight;
        clientHeight = el.clientHeight;
      }

      currentScrollRef.current = Math.round(scrollTop);
      const isBottom = (scrollTop + clientHeight >= scrollHeight - 150);
      if (isBottom) hasReachedBottom.current = true;
    };

    // 옵션에 { capture: true }를 주어야 내부 div의 스크롤을 낚아챌 수 있습니다.
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    const saveProgress = async (isUnmounting = false) => {
      if (!isRestored.current) return;

      const currentScroll = currentScrollRef.current;
      
      if (!isUnmounting && currentScroll === lastSavedScroll.current) return;
      lastSavedScroll.current = currentScroll;

      try {
        const headers = await getAuthHeaders();
        await fetch("/api/progress", {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            passageId, 
            scrollPosition: currentScroll, 
            isRead: hasReachedBottom.current 
          }),
          keepalive: isUnmounting 
        });
      } catch (error) {
        // 무시
      }
    };

    const intervalId = setInterval(() => saveProgress(false), 3000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      saveProgress(true); 
    };
  }, [passageId]);

  return null;
}
