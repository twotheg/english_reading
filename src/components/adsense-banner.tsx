"use client";

import { useEffect } from "react";

interface AdSenseBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
}

export default function AdSenseBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
}: AdSenseBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center items-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "50px" }}
        data-ad-client="ca-pub-4424569297437395"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
}
