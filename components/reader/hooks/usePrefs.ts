"use client";

import { useState, useEffect } from "react";
import { themes, fonts, DEFAULT_PREFS, type Prefs, type Theme, type Font } from "../constants";

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ondoku-prefs");
      if (saved) {
        const parsed = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
        if (!(parsed.theme in themes)) parsed.theme = DEFAULT_PREFS.theme;
        if (!(parsed.font in fonts)) parsed.font = DEFAULT_PREFS.font;
        setPrefs(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("ondoku-prefs", JSON.stringify(prefs));
  }, [prefs]);

  const t = themes[prefs.theme];

  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = t.bg;
    return () => {
      root.style.backgroundColor = "";
    };
  }, [t.bg]);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  return { prefs, set, t };
}

export type { Theme, Font, Prefs };
