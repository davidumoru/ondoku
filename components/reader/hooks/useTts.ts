"use client";

import { useState, useEffect, useRef } from "react";

export type TtsState = "idle" | "loading" | "playing" | "paused";

interface WordTiming {
  startTime: number;
  endTime: number;
}

interface CharacterAlignment {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

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

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractWordTimings(alignment: CharacterAlignment): WordTiming[] {
  const { characters, characterStartTimesSeconds, characterEndTimesSeconds } =
    alignment;
  const words: WordTiming[] = [];
  let inWord = false;
  let wordStart = 0;

  for (let i = 0; i < characters.length; i++) {
    const isWordChar = /\S/.test(characters[i]);
    if (isWordChar && !inWord) {
      inWord = true;
      wordStart = characterStartTimesSeconds[i];
    } else if (!isWordChar && inWord) {
      inWord = false;
      words.push({
        startTime: wordStart,
        endTime: characterEndTimesSeconds[i - 1],
      });
    }
  }
  if (inWord) {
    words.push({
      startTime: wordStart,
      endTime: characterEndTimesSeconds[characterEndTimesSeconds.length - 1],
    });
  }
  return words;
}

function findWordIndex(wordTimings: WordTiming[], currentTime: number): number {
  let lo = 0;
  let hi = wordTimings.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (wordTimings[mid].startTime <= currentTime) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export function useTts(content: string) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const chunkWordOffsetsRef = useRef<number[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const prefetchRef = useRef<Promise<{
    blob: Blob;
    wordTimings: WordTiming[];
  }> | null>(null);
  const wordTimingsRef = useRef<WordTiming[]>([]);
  const lastWordIndexRef = useRef(-1);

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
    wordTimingsRef.current = [];
    lastWordIndexRef.current = -1;
    setTtsState("idle");
    setTtsError(null);
    setActiveWordIndex(-1);
  }

  async function fetchChunkData(
    index: number,
    signal: AbortSignal,
  ): Promise<{ blob: Blob; wordTimings: WordTiming[] }> {
    const chunks = chunksRef.current;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: chunks[index],
        previousText: index > 0 ? chunks[index - 1] : undefined,
        nextText: index < chunks.length - 1 ? chunks[index + 1] : undefined,
      }),
      signal,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    const { audioBase64, alignment } = await res.json();
    console.log(
      "[ondoku] alignment chars:",
      alignment?.characters?.length ?? "null",
    );
    const blob = base64ToBlob(audioBase64, "audio/mpeg");
    const wordTimings = alignment ? extractWordTimings(alignment) : [];
    console.log("[ondoku] word timings:", wordTimings.length);
    return { blob, wordTimings };
  }

  async function playChunk(index: number, signal: AbortSignal) {
    if (index >= chunksRef.current.length || signal.aborted) {
      if (!signal.aborted) {
        setTtsState("idle");
        setActiveWordIndex(-1);
      }
      return;
    }

    setTtsState("loading");

    try {
      const dataPromise = prefetchRef.current ?? fetchChunkData(index, signal);
      prefetchRef.current = null;

      const { blob, wordTimings } = await dataPromise;
      if (signal.aborted) return;

      wordTimingsRef.current = wordTimings;

      const nextIndex = index + 1;
      if (nextIndex < chunksRef.current.length) {
        prefetchRef.current = fetchChunkData(nextIndex, signal);
      }

      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      const chunkOffset = chunkWordOffsetsRef.current[index] ?? 0;

      let loggedFirst = false;
      audio.ontimeupdate = () => {
        if (!loggedFirst) {
          console.log(
            "[ondoku] ontimeupdate firing, timings:",
            wordTimingsRef.current.length,
          );
          loggedFirst = true;
        }
        const localIdx = findWordIndex(
          wordTimingsRef.current,
          audio.currentTime,
        );
        const globalIdx = localIdx >= 0 ? chunkOffset + localIdx : -1;
        if (globalIdx !== lastWordIndexRef.current) {
          lastWordIndexRef.current = globalIdx;
          console.log("[ondoku] activeWordIndex →", globalIdx);
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

      chunkIndexRef.current = nextIndex;
      await playChunk(nextIndex, signal);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setTtsState("idle");
        setTtsError((e as Error).message || "Failed to generate audio");
        setActiveWordIndex(-1);
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
    const chunks = chunkText(text);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;

    // Pre-compute cumulative word offsets per chunk
    const offsets: number[] = [];
    let cumulative = 0;
    for (const chunk of chunks) {
      offsets.push(cumulative);
      cumulative += countWords(chunk);
    }
    chunkWordOffsetsRef.current = offsets;

    const controller = new AbortController();
    abortRef.current = controller;

    await playChunk(0, controller.signal);
  }

  function pause() {
    audioRef.current?.pause();
    setTtsState("paused");
  }

  return { ttsState, ttsError, activeWordIndex, play, pause, stop };
}
