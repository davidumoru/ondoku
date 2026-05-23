"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  base64ToBlob,
  chunkText,
  chunkWordOffsets,
  extractWordTimings,
  findWordIndex,
  htmlToPlainText,
  type CharacterAlignment,
  type WordTiming,
} from "../tts/timing";

export type TtsState = "idle" | "loading" | "playing" | "paused";

interface ChunkData {
  blob: Blob;
  wordTimings: WordTiming[];
}

interface ChunkRequest {
  text: string;
  previousText?: string;
  nextText?: string;
}

interface ChunkResponse {
  audioBase64: string;
  alignment: CharacterAlignment | null;
}

export function useTts(content: string) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const offsetsRef = useRef<number[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<Promise<ChunkData> | null>(null);
  const wordTimingsRef = useRef<WordTiming[]>([]);
  const lastWordIndexRef = useRef(-1);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    prefetchRef.current = null;
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
    chunksRef.current = [];
    offsetsRef.current = [];
    wordTimingsRef.current = [];
    lastWordIndexRef.current = -1;
    setTtsState("idle");
    setTtsError(null);
    setActiveWordIndex(-1);
  }, []);

  useEffect(() => stop, [stop]);

  const fetchChunk = useCallback(
    async (index: number, signal: AbortSignal): Promise<ChunkData> => {
      const chunks = chunksRef.current;
      const body: ChunkRequest = {
        text: chunks[index],
        previousText: index > 0 ? chunks[index - 1] : undefined,
        nextText: index < chunks.length - 1 ? chunks[index + 1] : undefined,
      };

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) throw new Error(await res.text());

      const { audioBase64, alignment }: ChunkResponse = await res.json();
      return {
        blob: base64ToBlob(audioBase64, "audio/mpeg"),
        wordTimings: alignment ? extractWordTimings(alignment) : [],
      };
    },
    [],
  );

  const play = useCallback(async () => {
    if (ttsState === "paused" && audioRef.current) {
      await audioRef.current.play();
      setTtsState("playing");
      return;
    }

    stop();
    const chunks = chunkText(htmlToPlainText(content));
    if (chunks.length === 0) return;

    chunksRef.current = chunks;
    offsetsRef.current = chunkWordOffsets(chunks);

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) return;
      setTtsState("loading");

      try {
        const dataPromise = prefetchRef.current ?? fetchChunk(i, signal);
        prefetchRef.current = null;

        const { blob, wordTimings } = await dataPromise;
        if (signal.aborted) return;

        wordTimingsRef.current = wordTimings;

        if (i + 1 < chunks.length) {
          prefetchRef.current = fetchChunk(i + 1, signal);
        }

        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.push(url);

        const audio = new Audio(url);
        audioRef.current = audio;
        const chunkOffset = offsetsRef.current[i] ?? 0;

        audio.ontimeupdate = () => {
          const localIdx = findWordIndex(wordTimingsRef.current, audio.currentTime);
          const globalIdx = localIdx >= 0 ? chunkOffset + localIdx : -1;
          if (globalIdx !== lastWordIndexRef.current) {
            lastWordIndexRef.current = globalIdx;
            setActiveWordIndex(globalIdx);
          }
        };

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
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setTtsState("idle");
          setTtsError((e as Error).message || "Failed to generate audio");
          setActiveWordIndex(-1);
        }
        return;
      }
    }

    setTtsState("idle");
    setActiveWordIndex(-1);
  }, [content, fetchChunk, stop, ttsState]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setTtsState("paused");
  }, []);

  return { ttsState, ttsError, activeWordIndex, play, pause, stop };
}
