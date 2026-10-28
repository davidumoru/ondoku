"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon, StopIcon } from "@hugeicons/core-free-icons";
import type { TtsState } from "./hooks/useTts";
import { IconSwap } from "./IconSwap";

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
  const isPlaying = ttsState === "playing";
  const isLoading = ttsState === "loading";
  const isActive = ttsState !== "idle";

  return (
    <>
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="r-icon-btn"
        aria-label={isPlaying ? "Pause" : "Play article"}
        disabled={isLoading}
        title={ttsError ?? undefined}
        style={{
          opacity: isLoading ? 0.5 : 1,
          color: ttsError ? accentColor : undefined,
        }}
      >
        <IconSwap
          base={<HugeiconsIcon icon={PlayIcon} size={16} />}
          alt={<HugeiconsIcon icon={PauseIcon} size={16} />}
          showAlt={isPlaying}
        />
      </button>

      {isActive && (
        <button onClick={onStop} className="r-icon-btn" aria-label="Stop">
          <HugeiconsIcon icon={StopIcon} size={16} />
        </button>
      )}
    </>
  );
}
