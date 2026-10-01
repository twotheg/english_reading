import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "English 10-Minute Reader",
  description:
    "Level-based English 10-minute reading with touch-to-speak and long-press definitions.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EngRead",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      {/* overscroll-none을 유지하면서 하단 광고(60px)를 위한 여백 설정 */}
      <body className="bg-slate-950 text-slate-100 antialiased overscroll-none pb-[60px]">
        <ServiceWorkerRegister />
        
        {/* 메인 콘텐츠 영역 */}
        {children}

        {/* [추가된 부분] 앱 하단에 항상 고정되는 AdMob 광고 영역 */}
        <div className="fixed bottom-0 left-0 w-full h-[60px] bg-slate-900 border-t border-slate-800 flex items-center justify-center z-50">
          <p className="text-xs text-slate-500 font-medium">AdMob Banner (320x50)</p>
          {/* 앱으로 출시할 때 실제 광고 스크립트나 네이티브 뷰가 들어갈 자리입니다. */}
        </div>
      </body>
    </html>
  );
}
