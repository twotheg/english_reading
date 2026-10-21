"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client"; // ⭐ 클라이언트 추가

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);
  const hasReachedBottom = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // ⭐ 현재 로그인된 사용자의 강력한 토큰을 가져오는 함수
    const getAuthHeaders = async () => {
      const { data } = await supabase.auth.getSession();
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.session?.access_token || ""}`
      };
    };

    const fetchProgress = async () => {
      try {
        const headers = await getAuthHeaders();
        // ⭐ &t=\${Date.now()} 를 끝에 붙여 서비스 워커의 악성 캐시를 완벽히 우회!
        const res = await fetch(`/api/progress?passageId=${passageId}&t=${Date.now()}`, { 
          headers,
          cache: "no-store" 
        });
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
      const isBottom = (currentScroll + clientHeight >= scrollHeight - 150) || (scrollHeight <= clientHeight + 50);

      if (isBottom) hasReachedBottom.current = true;

      if (currentScroll === lastSavedScroll.current) return;
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
        });
      } catch (error) {
        // 무시
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [passageId]);

  return null;
}
