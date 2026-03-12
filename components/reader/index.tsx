"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Share04Icon,
  FileDownloadIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import TurndownService from "turndown";
import type { DefuddleResponse } from "defuddle/node";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

import { fonts } from "./constants";
import { usePrefs } from "./hooks/usePrefs";
import { useTts } from "./hooks/useTts";
import { useSettings } from "./hooks/useSettings";
import { SettingsContent } from "./SettingsContent";
import { TtsControls } from "./TtsControls";
import { ArticleContent } from "./ArticleContent";

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

interface Props {
  article: DefuddleResponse;
  url: string;
}

export function Reader({ article }: Props) {
  const router = useRouter();
  const { prefs, set, t } = usePrefs();
  const { ttsState, ttsError, activeWordIndex, play, pause, stop } = useTts(
    article.content,
  );
  const { showSettings, setShowSettings, isMobile, settingsRef } =
    useSettings();
  const [copied, setCopied] = useState<"share" | "md" | null>(null);

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

        <TtsControls
          ttsState={ttsState}
          ttsError={ttsError}
          accentColor={t.accent}
          onPlay={play}
          onPause={pause}
          onStop={stop}
        />

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

          {!isMobile && showSettings && (
            <div
              className="r-settings"
              style={{ background: t.bg, borderColor: t.border, color: t.fg }}
            >
              <SettingsContent t={t} prefs={prefs} set={set} />
            </div>
          )}
        </div>

        <Drawer open={isMobile && showSettings} onOpenChange={setShowSettings}>
          <DrawerContent
            style={{ background: t.bg, borderColor: t.border, color: t.fg }}
          >
            <div className="r-settings-inner">
              <SettingsContent t={t} prefs={prefs} set={set} />
            </div>
          </DrawerContent>
        </Drawer>
      </header>

      <ArticleContent
        article={article}
        mutedColor={t.muted}
        activeWordIndex={activeWordIndex}
      />
    </div>
  );
}
