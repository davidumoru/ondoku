export interface WordTiming {
  startTime: number;
  endTime: number;
}

export interface CharacterAlignment {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

export function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText || div.textContent || "";
}

export function chunkText(text: string, maxChars = 4000): string[] {
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

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function chunkWordOffsets(chunks: string[]): number[] {
  const offsets: number[] = [];
  let total = 0;
  for (const chunk of chunks) {
    offsets.push(total);
    total += countWords(chunk);
  }
  return offsets;
}

export function extractWordTimings(alignment: CharacterAlignment): WordTiming[] {
  const { characters, characterStartTimesSeconds, characterEndTimesSeconds } = alignment;
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
      words.push({ startTime: wordStart, endTime: characterEndTimesSeconds[i - 1] });
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

export function findWordIndex(timings: WordTiming[], currentTime: number): number {
  let lo = 0;
  let hi = timings.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timings[mid].startTime <= currentTime) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}
