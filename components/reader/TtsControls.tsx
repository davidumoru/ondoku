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

const SWAP_EASE = "cubic-bezier(0.2, 0, 0, 1)";

function swapStyle(visible: boolean): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: `scale(${visible ? 1 : 0.25})`,
    filter: `blur(${visible ? 0 : 4}px)`,
    transition: `opacity 200ms ${SWAP_EASE}, transform 200ms ${SWAP_EASE}, filter 200ms ${SWAP_EASE}`,
  };
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
        <span className="relative inline-flex w-4 h-4 items-center justify-center">
          <span className="absolute inset-0 inline-flex items-center justify-center" style={swapStyle(!isPlaying)}>
            <HugeiconsIcon icon={PlayIcon} size={16} />
          </span>
          <span className="absolute inset-0 inline-flex items-center justify-center" style={swapStyle(isPlaying)}>
            <HugeiconsIcon icon={PauseIcon} size={16} />
          </span>
        </span>
      </button>

      {isActive && (
        <button onClick={onStop} className="r-icon-btn" aria-label="Stop">
          <HugeiconsIcon icon={StopIcon} size={16} />
        </button>
      )}
    </>
  );
}
