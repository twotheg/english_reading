"use client";

import { useEffect, useRef } from "react";

export default function WakeLock() {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        // 브라우저가 Wake Lock API를 지원하는지 확인
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          console.log("화면 꺼짐 방지(Wake Lock) 활성화");
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };

    // 사용자가 앱을 최소화했다가 다시 돌아왔을 때 Wake Lock 재활성화
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 컴포넌트가 언마운트(앱 종료)될 때 리소스 해제
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 화면에 그릴 UI는 없으므로 null 반환
  return null;
}
