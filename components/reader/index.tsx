"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Share2, FileDown, Check } from "lucide-react";
import TurndownService from "turndown";
import type { DefuddleResponse } from "defuddle/node";

const themes = {
  dawn: {
    label: "Dawn",
    bg: "#FAFAF8",
    fg: "#1C1B1A",
    muted: "#6B6963",
    accent: "#1D4ED8",
    border: "#E8E6E0",
    codeBg: "#F0EEE9",
    accentBorder: "#C8C5BC",
    swatch: "#FAFAF8",
  },
  dusk: {
    label: "Dusk",
    bg: "#141413",
    fg: "#E8E6E0",
    muted: "#878580",
    accent: "#60A5FA",
    border: "#252422",
    codeBg: "#1C1B1A",
    accentBorder: "#4A4845",
    swatch: "#141413",
  },
  sepia: {
    label: "Sepia",
    bg: "#F5EDD7",
    fg: "#3D2B1F",
    muted: "#8B7355",
    accent: "#7C3A12",
    border: "#DDD0B3",
    codeBg: "#EDE3C8",
    accentBorder: "#C4A882",
    swatch: "#F5EDD7",
  },
  print: {
    label: "Print",
    bg: "#FFFFFF",
    fg: "#111111",
    muted: "#555555",
    accent: "#000000",
    border: "#E0E0E0",
    codeBg: "#F5F5F5",
    accentBorder: "#111111",
    swatch: "#FFFFFF",
  },
} as const;

const fonts = {
  serif: { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  sans: { label: "Sans", value: "system-ui, -apple-system, sans-serif" },
} as const;

const sizes: { label: string; value: number }[] = [
  { label: "S", value: 15 },
  { label: "M", value: 17 },
  { label: "L", value: 19 },
  { label: "XL", value: 21 },
];

type Theme = keyof typeof themes;
type Font = keyof typeof fonts;

interface Prefs {
  theme: Theme;
  font: Font;
  size: number;
}

const DEFAULT_PREFS: Prefs = { theme: "dawn", font: "serif", size: 17 };

interface Props {
  article: DefuddleResponse;
  url: string;
}

const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export function Reader({ article }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const saved = localStorage.getItem("ondoku-prefs");
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PREFS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const t = themes[prefs.theme];

  useEffect(() => {
    localStorage.setItem("ondoku-prefs", JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = t.bg;
    return () => { root.style.backgroundColor = ""; };
  }, [t.bg]);

  useEffect(() => {
    if (!showSettings) return;
    function onPointerDown(e: PointerEvent) {
      if (!settingsRef.current?.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showSettings]);
  const readingTime = Math.ceil((article.wordCount ?? 0) / 200);

  const [copied, setCopied] = useState<"share" | "md" | null>(null);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function flash(type: "share" | "md") {
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title ?? undefined, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      flash("share");
    }
  }

  async function handleCopyMarkdown() {
    const md = [
      `# ${article.title ?? ""}`,
      article.author ? `*${article.author}*` : "",
      td.turndown(article.content),
    ].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(md);
    flash("md");
  }

  return (
    <div
      className="reader-wrap"
      style={
        {
          "--r-bg": t.bg,
          "--r-fg": t.fg,
          "--r-muted": t.muted,
          "--r-accent": t.accent,
          "--r-border": t.border,
          "--r-code-bg": t.codeBg,
          "--r-accent-border": t.accentBorder,
          "--r-size": `${prefs.size}px`,
          "--r-font": fonts[prefs.font].value,
        } as React.CSSProperties
      }
    >
      <header className="r-topbar">
        <button
          onClick={() => router.back()}
          className="r-icon-btn"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0 mx-3">
          {article.favicon && (
            <Image
              src={article.favicon}
              alt=""
              width={14}
              height={14}
              unoptimized
              className="rounded-sm shrink-0"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          )}
          <span className="r-domain truncate">{article.domain}</span>
        </div>

        <button onClick={handleCopyMarkdown} className="r-icon-btn" aria-label="Copy as Markdown">
          {copied === "md" ? <Check size={14} /> : <FileDown size={16} />}
        </button>

        <button onClick={handleShare} className="r-icon-btn" aria-label="Share">
          {copied === "share" ? <Check size={14} /> : <Share2 size={16} />}
        </button>

        <div ref={settingsRef} className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="r-icon-btn r-aa-btn"
            aria-label="Reading settings"
          >
            Aa
          </button>

          {showSettings && (
            <div
              className="r-settings"
              style={{ background: t.bg, borderColor: t.border, color: t.fg }}
            >
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
                      title={themes[key].label}
                      style={{
                        background: themes[key].swatch,
                        border: `1.5px solid ${
                          prefs.theme === key ? t.accent : themes[key].border
                        }`,
                        outline:
                          prefs.theme === key
                            ? `2px solid ${t.accent}`
                            : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="r-settings-section">
                <span className="r-settings-label" style={{ color: t.muted }}>
                  Font
                </span>
                <div className="r-btn-group">
                  {(Object.keys(fonts) as Font[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => set("font", key)}
                      className="r-option-btn"
                      style={{
                        fontFamily: fonts[key].value,
                        background:
                          prefs.font === key ? t.fg : "transparent",
                        color: prefs.font === key ? t.bg : t.fg,
                        borderColor: t.border,
                      }}
                    >
                      {fonts[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="r-settings-section">
                <span className="r-settings-label" style={{ color: t.muted }}>
                  Size
                </span>
                <div className="r-btn-group">
                  {sizes.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => set("size", s.value)}
                      className="r-option-btn"
                      style={{
                        background:
                          prefs.size === s.value ? t.fg : "transparent",
                        color: prefs.size === s.value ? t.bg : t.fg,
                        borderColor: t.border,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <div className="r-article">
          <div className="r-article-header">
            {article.image && (
              <Image
                src={article.image}
                alt={article.title ?? ""}
                width={0}
                height={0}
                sizes="100vw"
                unoptimized
                className="r-hero"
              />
            )}
            <h1 className="r-title">{article.title}</h1>
            <div className="r-meta" style={{ color: t.muted }}>
              {article.author && <span>{article.author}</span>}
              {article.author && article.published && (
                <span className="r-meta-sep">·</span>
              )}
              {article.published && (
                <span>
                  {new Date(article.published).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              {(article.author || article.published) && (
                <span className="r-meta-sep">·</span>
              )}
              <span>{readingTime} min read</span>
            </div>
          </div>

          <div
            className="r-article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </main>
    </div>
  );
}
