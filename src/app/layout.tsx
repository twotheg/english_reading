import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import WakeLock from "@/components/wake-lock"; // Wake Lock 컴포넌트 불러오기

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReadFlow: English Reading",
  description: "Improve your English reading with daily fairy tales, in-depth articles, and news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 구글 애드센스 전역 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4424569297437395"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-50`}>
        {/* 앱이 실행되는 동안 화면이 꺼지지 않도록 숨겨진 상태로 동작합니다 */}
        <WakeLock />
        {children}
      </body>
    </html>
  );
}
