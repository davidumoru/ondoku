import { Defuddle } from "defuddle/node";
import type { DefuddleResponse } from "defuddle/node";

const DEFAULT_UA = "Mozilla/5.0 (compatible; Ondoku/1.0)";
const BOT_UA = `${DEFAULT_UA} bot`;
const MAX_SIZE = 5 * 1024 * 1024;

const WIN1252: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

function decodeWindows1252(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    const mapped = new Uint16Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      mapped[j] = WIN1252[slice[j]] ?? slice[j];
    }
    parts.push(String.fromCharCode(...mapped));
  }
  return parts.join("");
}

function detectCharset(contentType: string, buffer: ArrayBuffer): string {
  const headerMatch = contentType.match(/charset=([^\s;]+)/i);
  if (headerMatch) return headerMatch[1].toLowerCase();

  const head = new TextDecoder("latin1").decode(buffer.slice(0, 1024));
  const metaCharset = head.match(/<meta[^>]+charset=["']?([^\s"';>]+)/i);
  if (metaCharset) return metaCharset[1].toLowerCase();

  const metaHttpEquiv = head.match(/<meta[^>]+content=["'][^"']*charset=([^\s"';]+)/i);
  if (metaHttpEquiv) return metaHttpEquiv[1].toLowerCase();

  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8192));
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0x80 && b <= 0x9f) return "windows-1252";
    if (b >= 0xc0 && b <= 0xf7) {
      const seqLen = b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
      let valid = true;
      for (let j = 1; j < seqLen && i + j < bytes.length; j++) {
        if ((bytes[i + j] & 0xc0) !== 0x80) { valid = false; break; }
      }
      if (valid) { i += seqLen - 1; continue; }
      return "windows-1252";
    }
  }
  return "utf-8";
}

function decodeHtml(buffer: ArrayBuffer, contentType: string): string {
  const charset = detectCharset(contentType, buffer);
  if (["windows-1252", "iso-8859-1", "latin1"].includes(charset)) {
    return decodeWindows1252(buffer);
  }
  return new TextDecoder(charset).decode(buffer);
}

async function fetchPage(url: string, ua: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`Not an HTML page (content-type: ${contentType})`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_SIZE) {
    throw new Error("Page too large");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_SIZE) throw new Error("Page too large");

  return decodeHtml(buffer, contentType);
}

function resolveUrls(result: DefuddleResponse, base: string): DefuddleResponse {
  const resolve = (u: string | null | undefined): string | undefined => {
    if (!u) return undefined;
    try { return new URL(u, base).href; } catch { return u; }
  };
  return { ...result, favicon: resolve(result.favicon) as string, image: resolve(result.image) as string };
}

export async function extractArticle(url: string): Promise<DefuddleResponse> {
  const html = await fetchPage(url, DEFAULT_UA);
  const result = await Defuddle(html, url);

  if (result.wordCount === 0) {
    try {
      const botHtml = await fetchPage(url, BOT_UA);
      const botResult = await Defuddle(botHtml, url);
      if (botResult.wordCount > 0) return resolveUrls(botResult, url);
    } catch {}
  }

  return resolveUrls(result, url);
}
