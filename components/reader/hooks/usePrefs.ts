"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { themes, fonts, DEFAULT_PREFS, type Prefs, type Theme, type Font } from "../constants";

const PREFS_KEY = "ondoku-prefs";
const PREFS_EVENT = "ondoku-prefs-change";

let cache: { raw: string | null; value: Prefs } | null = null;

// Memoized by raw string so useSyncExternalStore's snapshot identity stays stable.
function parsePrefs(raw: string | null): Prefs {
  if (cache && cache.raw === raw) return cache.value;
  let value: Prefs = DEFAULT_PREFS;
  if (raw) {
    try {
      const parsed = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
      if (!(parsed.theme in themes)) parsed.theme = DEFAULT_PREFS.theme;
      if (!(parsed.font in fonts)) parsed.font = DEFAULT_PREFS.font;
      value = parsed;
    } catch {
      value = DEFAULT_PREFS;
    }
  }
  cache = { raw, value };
  return value;
}

function getSnapshot(): Prefs {
  return parsePrefs(localStorage.getItem(PREFS_KEY));
}

function getServerSnapshot(): Prefs {
  return DEFAULT_PREFS;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(PREFS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PREFS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function usePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = themes[prefs.theme];

  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const current = parsePrefs(localStorage.getItem(PREFS_KEY));
    const next = { ...current, [key]: value };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PREFS_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.style.backgroundColor = t.bg;
    return () => {
      document.documentElement.style.backgroundColor = "";
    };
  }, [t.bg]);

  return { prefs, set, t };
}

export type { Theme, Font, Prefs };
