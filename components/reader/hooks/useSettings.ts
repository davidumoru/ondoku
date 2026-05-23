"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 640px)";

function subscribeMobile(callback: () => void): () => void {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot(): boolean {
  return false;
}

export function useSettings() {
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
  const settingsRef = useRef<HTMLDivElement>(null);

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
