"use client";

// components/AdSlot.tsx
//
// Thin wrapper around a Google AdSense unit. The <ins> tag needs
// window.adsbygoogle.push({}) called after it mounts, or the ad never
// renders. Reuse this everywhere instead of hand-rolling the push() call.
//
// NOTE: create the actual ad units in your AdSense dashboard first, then
// swap `data-ad-slot` below for the real slot IDs — the placeholder value
// won't serve real ads.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSlot({
  slot,
  className = "",
  format = "auto",
}: {
  slot: string;
  className?: string;
  format?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded yet (e.g. ad blocker) — fail silently,
      // never let an ad error break the page for citizens trying to get
      // civic information.
    }
  }, []);

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-1184595877548269"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
