"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon, StopIcon } from "@hugeicons/core-free-icons";
import type { TtsState } from "./hooks/useTts";

interface TtsControlsProps {
  ttsState: TtsState;
  ttsError: string | null;
  accentColor: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function TtsControls({
  ttsState,
  ttsError,
  accentColor,
  onPlay,
  onPause,
  onStop,
}: TtsControlsProps) {
  return (
    <>
      {ttsState === "idle" || ttsState === "loading" ? (
        <button
          onClick={onPlay}
          className="r-icon-btn"
          aria-label="Play article"
          disabled={ttsState === "loading"}
          title={ttsError ?? undefined}
          style={{
            opacity: ttsState === "loading" ? 0.5 : 1,
            color: ttsError ? accentColor : undefined,
          }}
        >
          <HugeiconsIcon icon={PlayIcon} size={16} />
        </button>
      ) : ttsState === "playing" ? (
        <button onClick={onPause} className="r-icon-btn" aria-label="Pause">
          <HugeiconsIcon icon={PauseIcon} size={16} />
        </button>
      ) : (
        <button onClick={onPlay} className="r-icon-btn" aria-label="Resume">
          <HugeiconsIcon icon={PlayIcon} size={16} />
        </button>
      )}

      {ttsState !== "idle" && (
        <button onClick={onStop} className="r-icon-btn" aria-label="Stop">
          <HugeiconsIcon icon={StopIcon} size={16} />
        </button>
      )}
    </>
  );
}
