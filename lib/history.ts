import { createLocalStore } from "./local-store";

const HISTORY_LIMIT = 12;

export const EMPTY_HISTORY: HistoryItem[] = [];

export interface HistoryItem {
  url: string;
  title: string;
  domain?: string;
  favicon?: string;
  image?: string;
  author?: string;
  wordCount?: number;
  readAt: number;
}

function normalizeItem(item: HistoryItem): HistoryItem {
  return {
    ...item,
    title:
      (typeof item.title === "string" ? item.title.trim() : "") || item.url,
    readAt: Number.isFinite(item.readAt) ? item.readAt : Date.now(),
  };
}

function parseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return EMPTY_HISTORY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_HISTORY;
    const items = parsed
      .filter(
        (item): item is HistoryItem =>
          !!item && typeof item === "object" && typeof item.url === "string",
      )
      .map(normalizeItem)
      .sort((a, b) => b.readAt - a.readAt)
      .slice(0, HISTORY_LIMIT);
    return items.length > 0 ? items : EMPTY_HISTORY;
  } catch {
    return EMPTY_HISTORY;
  }
}

export const historyStore = createLocalStore("ondoku-history", parseHistory);

function writeHistory(items: HistoryItem[]) {
  historyStore.write(items.slice(0, HISTORY_LIMIT));
}

export function saveHistoryItem(item: HistoryItem) {
  writeHistory([
    normalizeItem(item),
    ...historyStore.read().filter((existing) => existing.url !== item.url),
  ]);
}

export function removeHistoryItem(url: string) {
  writeHistory(historyStore.read().filter((item) => item.url !== url));
}

export function clearHistory() {
  writeHistory([]);
}
