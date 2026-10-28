"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { themes, fonts, sizes, DEFAULT_PREFS, type Prefs } from "../constants";

const PREFS_KEY = "ondoku-prefs";
const PREFS_EVENT = "ondoku-prefs-change";

let cache: { raw: string | null; value: Prefs } | null = null;

function parsePrefs(raw: string | null): Prefs {
  if (cache && cache.raw === raw) return cache.value;
  let value: Prefs = DEFAULT_PREFS;
  if (raw) {
    try {
      const parsed = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
      if (!Object.hasOwn(themes, parsed.theme))
        parsed.theme = DEFAULT_PREFS.theme;
      if (!Object.hasOwn(fonts, parsed.font)) parsed.font = DEFAULT_PREFS.font;
      if (!sizes.some((s) => s.value === parsed.size))
        parsed.size = DEFAULT_PREFS.size;
      if (typeof parsed.highlight !== "boolean")
        parsed.highlight = DEFAULT_PREFS.highlight;
      value = parsed;
    } catch {
      value = DEFAULT_PREFS;
    }
  }
  cache = { raw, value };
  return value;
}

function readPrefs(): Prefs {
  try {
    return parsePrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return DEFAULT_PREFS;
  }
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
  const prefs = useSyncExternalStore(subscribe, readPrefs, getServerSnapshot);
  const t = themes[prefs.theme];

  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const next = { ...readPrefs(), [key]: value };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      return;
    }
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
