"use client";

import { useState, useEffect, useRef } from "react";

export type TtsState = "idle" | "loading" | "playing" | "paused";

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

export function useTts(content: string) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      objectUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  function stop() {
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
      const blobPromise = prefetchRef.current ?? fetchChunkBlob(index, signal);
      prefetchRef.current = null;

      const blob = await blobPromise;
      if (signal.aborted) return;

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

  async function play() {
    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play();
      setTtsState("playing");
      return;
    }

    stop();
    const text = htmlToPlainText(content);
    chunksRef.current = chunkText(text);
    chunkIndexRef.current = 0;

    const controller = new AbortController();
    abortRef.current = controller;

    await playChunk(0, controller.signal);
  }

  function pause() {
    audioRef.current?.pause();
    setTtsState("paused");
  }

  return { ttsState, ttsError, play, pause, stop };
}
