"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";
import { themes, fonts, sizes, DEFAULT_PREFS, type Prefs } from "../constants";

function parsePrefs(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    if (!Object.hasOwn(themes, parsed.theme))
      parsed.theme = DEFAULT_PREFS.theme;
    if (!Object.hasOwn(fonts, parsed.font)) parsed.font = DEFAULT_PREFS.font;
    if (!sizes.some((s) => s.value === parsed.size))
      parsed.size = DEFAULT_PREFS.size;
    if (typeof parsed.highlight !== "boolean")
      parsed.highlight = DEFAULT_PREFS.highlight;
    return parsed;
  } catch {
    return DEFAULT_PREFS;
  }
}

const store = createLocalStore("ondoku-prefs", parsePrefs);

function getServerSnapshot(): Prefs {
  return DEFAULT_PREFS;
}

function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  store.write({ ...store.read(), [key]: value });
}

export function usePrefs() {
  const prefs = useSyncExternalStore(
    store.subscribe,
    store.read,
    getServerSnapshot,
  );
  const t = themes[prefs.theme];

  useEffect(() => {
    document.documentElement.style.backgroundColor = t.bg;
    return () => {
      document.documentElement.style.backgroundColor = "";
    };
  }, [t.bg]);

  return { prefs, set, t };
}
