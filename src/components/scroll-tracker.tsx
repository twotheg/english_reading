"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function ScrollTracker({ passageId }: { passageId: number }) {
  const isRestored = useRef(false);
  const lastSavedScroll = useRef(-1);
  const hasReachedBottom = useRef(false);
  
  // ⭐ 스크롤이 움직일 때마다 실시간 위치를 임시로 기억해둘 공간 (뒤로가기 대비용)
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
              // ⭐ smooth(스르륵) 대신 auto(즉시 이동)로 변경하여 씹힘 현상 방지
              // 화면이 그려지는 시간을 고려해 0.3초, 0.8초에 두 번 확실하게 쐐기를 박아줍니다!
              setTimeout(() => window.scrollTo({ top: data.progress.scrollPosition, behavior: "auto" }), 300);
              setTimeout(() => window.scrollTo({ top: data.progress.scrollPosition, behavior: "auto" }), 800);
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

    // ⭐ 스크롤을 할 때마다 화면 위치만 가볍게 기록 (서버 전송 X)
    const handleScroll = () => {
      currentScrollRef.current = Math.round(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);

    // 서버로 전송하는 핵심 함수
    const saveProgress = async (isUnmounting = false) => {
      if (!isRestored.current) return;

      const currentScroll = currentScrollRef.current;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isBottom = (currentScroll + clientHeight >= scrollHeight - 150) || (scrollHeight <= clientHeight + 50);

      if (isBottom) hasReachedBottom.current = true;

      // 앱을 끄는 중(뒤로가기)이 아닌데 스크롤이 그대로면 무시
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
          // ⭐ 핵심: 뒤로가기를 눌러 화면이 파괴되어도, 백그라운드에서 기필코 서버로 전송하고 죽으라는 옵션
          keepalive: isUnmounting 
        });
      } catch (error) {
        // 무시
      }
    };

    // 평소에는 3초마다 조용히 저장
    const intervalId = setInterval(() => saveProgress(false), 3000);

    // ⭐ 사용자가 '뒤로 가기'를 누르거나 다른 페이지로 넘어가는 순간! (Unmount)
    // 3초를 기다리지 않고 방금까지 읽던 스크롤 위치를 즉.시. 서버에 쏴버립니다.
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      saveProgress(true); 
    };
  }, [passageId]);

  return null;
}
