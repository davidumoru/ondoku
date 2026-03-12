"use client";

import { useState, useEffect, useRef } from "react";

export function useSettings() {
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!showSettings || isMobile) return;
    function onPointerDown(e: PointerEvent) {
      if (!settingsRef.current?.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showSettings, isMobile]);

  return { showSettings, setShowSettings, isMobile, settingsRef };
}
