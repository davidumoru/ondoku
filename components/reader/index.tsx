"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Share04Icon,
  FileDownloadIcon,
  Tick01Icon,
  PlayIcon,
  PauseIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
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
} as const;

const fonts = {
  lora: { label: "Lora", value: "var(--font-lora), Georgia, serif" },
  merriweather: { label: "Merriweather", value: "var(--font-merriweather), Georgia, serif" },
  inter: { label: "Inter", value: "var(--font-inter), system-ui, sans-serif" },
  sourceSans: { label: "Source Sans", value: "var(--font-source-sans), system-ui, sans-serif" },
  geist: { label: "Geist", value: "var(--font-geist-sans), system-ui, sans-serif" },
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

const DEFAULT_PREFS: Prefs = { theme: "dawn", font: "lora", size: 17 };

interface Props {
  article: DefuddleResponse;
  url: string;
}

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

type TtsState = "idle" | "loading" | "playing" | "paused";

function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText ?? div.textContent ?? "";
}

function chunkText(text: string, maxChars = 4000): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function Reader({ article }: Props) {
  const router = useRouter();
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
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const t = themes[prefs.theme];

  useEffect(() => {
    localStorage.setItem("ondoku-prefs", JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = t.bg;
    return () => {
      root.style.backgroundColor = "";
    };
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
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<Promise<Blob> | null>(null);

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
      await navigator.share({
        title: article.title ?? undefined,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      flash("share");
    }
  }

  function stopTts() {
    abortRef.current?.abort();
    abortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    prefetchRef.current = null;
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
    chunkIndexRef.current = 0;
    chunksRef.current = [];
    setTtsState("idle");
    setTtsError(null);
  }

  // Inline cleanup to avoid stale closure / ESLint warning
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      objectUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  function fetchChunkBlob(index: number, signal: AbortSignal): Promise<Blob> {
    const chunks = chunksRef.current;
    return fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: chunks[index],
        previousText: index > 0 ? chunks[index - 1] : undefined,
        nextText: index < chunks.length - 1 ? chunks[index + 1] : undefined,
      }),
      signal,
    }).then((res) => {
      if (!res.ok)
        return res.text().then((msg) => Promise.reject(new Error(msg)));
      return res.blob();
    });
  }

  async function playChunk(index: number, signal: AbortSignal) {
    if (index >= chunksRef.current.length || signal.aborted) {
      if (!signal.aborted) setTtsState("idle");
      return;
    }

    setTtsState("loading");

    try {
      // Use prefetched blob if available, otherwise fetch now
      const blobPromise = prefetchRef.current ?? fetchChunkBlob(index, signal);
      prefetchRef.current = null;

      const blob = await blobPromise;
      if (signal.aborted) return;

      // Prefetch next chunk while current one plays
      const nextIndex = index + 1;
      if (nextIndex < chunksRef.current.length) {
        prefetchRef.current = fetchChunkBlob(nextIndex, signal);
      }

      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback error"));
        audio.oncanplay = () => {
          if (!signal.aborted) setTtsState("playing");
        };
        audio.play().catch(reject);
        signal.addEventListener("abort", () => {
          audio.pause();
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

      chunkIndexRef.current = nextIndex;
      await playChunk(nextIndex, signal);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setTtsState("idle");
        setTtsError((e as Error).message || "Failed to generate audio");
      }
    }
  }

  async function handleTtsPlay() {
    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play();
      setTtsState("playing");
      return;
    }

    stopTts();
    const text = htmlToPlainText(article.content);
    chunksRef.current = chunkText(text);
    chunkIndexRef.current = 0;

    const controller = new AbortController();
    abortRef.current = controller;

    await playChunk(0, controller.signal);
  }

  function handleTtsPause() {
    audioRef.current?.pause();
    setTtsState("paused");
  }

  async function handleCopyMarkdown() {
    const md = [
      `# ${article.title ?? ""}`,
      article.author ? `*${article.author}*` : "",
      td.turndown(article.content),
    ]
      .filter(Boolean)
      .join("\n\n");
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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
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
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          )}
          <span className="r-domain truncate">{article.domain}</span>
        </div>

        {ttsState === "idle" || ttsState === "loading" ? (
          <button
            onClick={handleTtsPlay}
            className="r-icon-btn"
            aria-label="Play article"
            disabled={ttsState === "loading"}
            title={ttsError ?? undefined}
            style={{
              opacity: ttsState === "loading" ? 0.5 : 1,
              color: ttsError ? t.accent : undefined,
            }}
          >
            <HugeiconsIcon icon={PlayIcon} size={16} />
          </button>
        ) : ttsState === "playing" ? (
          <button
            onClick={handleTtsPause}
            className="r-icon-btn"
            aria-label="Pause"
          >
            <HugeiconsIcon icon={PauseIcon} size={16} />
          </button>
        ) : (
          <button
            onClick={handleTtsPlay}
            className="r-icon-btn"
            aria-label="Resume"
          >
            <HugeiconsIcon icon={PlayIcon} size={16} />
          </button>
        )}

        {ttsState !== "idle" && (
          <button onClick={stopTts} className="r-icon-btn" aria-label="Stop">
            <HugeiconsIcon icon={StopIcon} size={16} />
          </button>
        )}

        <button
          onClick={handleCopyMarkdown}
          className="r-icon-btn"
          aria-label="Copy as Markdown"
        >
          {copied === "md" ? (
            <HugeiconsIcon icon={Tick01Icon} size={14} />
          ) : (
            <HugeiconsIcon icon={FileDownloadIcon} size={16} />
          )}
        </button>

        <button onClick={handleShare} className="r-icon-btn" aria-label="Share">
          {copied === "share" ? (
            <HugeiconsIcon icon={Tick01Icon} size={14} />
          ) : (
            <HugeiconsIcon icon={Share04Icon} size={16} />
          )}
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
                        background: prefs.font === key ? t.fg : "transparent",
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
