"use client";

import { themes, fonts, sizes, type ThemeColors, type Prefs, type Theme, type Font } from "./constants";

interface SettingsContentProps {
  t: ThemeColors;
  prefs: Prefs;
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
}

export function SettingsContent({ t, prefs, set }: SettingsContentProps) {
  return (
    <>
      <div className="r-settings-section">
        <span className="r-settings-label" style={{ color: t.muted }}>
          Theme
        </span>
        <div className="r-theme-swatches">
          {(Object.keys(themes) as Theme[]).map((key) => (
            <button
              key={key}
              onClick={() => set("theme", key)}
              className="r-swatch"
              style={{
                background: themes[key].bg,
                borderColor:
                  prefs.theme === key ? themes[key].accent : themes[key].border,
                boxShadow:
                  prefs.theme === key
                    ? `0 0 0 2px ${themes[key].accent}`
                    : "none",
              }}
            >
              <span className="r-swatch-preview" style={{ color: themes[key].fg }}>
                Aa
              </span>
              <span className="r-swatch-name" style={{ color: themes[key].muted }}>
                {themes[key].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="r-settings-section">
        <span className="r-settings-label" style={{ color: t.muted }}>
          Font
        </span>
        <div className="r-font-grid">
          {(Object.keys(fonts) as Font[]).map((key) => (
            <button
              key={key}
              onClick={() => set("font", key)}
              className="r-font-btn"
              style={{
                background: prefs.font === key ? t.fg : "transparent",
                color: prefs.font === key ? t.bg : t.fg,
                borderColor: prefs.font === key ? t.fg : t.border,
              }}
            >
              <span className="r-font-sample" style={{ fontFamily: fonts[key].value }}>
                Ag
              </span>
              <span className="r-font-name">{fonts[key].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="r-settings-section">
        <span className="r-settings-label" style={{ color: t.muted }}>
          Size
        </span>
        <div className="r-size-row">
          {sizes.map((s) => (
            <button
              key={s.value}
              onClick={() => set("size", s.value)}
              className="r-size-btn"
              style={{
                background: prefs.size === s.value ? t.fg : "transparent",
                color: prefs.size === s.value ? t.bg : t.fg,
                borderColor: prefs.size === s.value ? t.fg : t.border,
              }}
            >
              <span className="r-size-letter" style={{ fontSize: `${s.value}px` }}>
                A
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
