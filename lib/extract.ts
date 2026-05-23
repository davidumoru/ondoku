import { Defuddle } from "defuddle/node";
import type { DefuddleResponse } from "defuddle/node";
import { assertSafeUrl, BOT_UA, fetchHtml, pickUserAgent } from "./fetch";

function resolveUrls(result: DefuddleResponse, base: string): DefuddleResponse {
  const resolve = (u: string | null | undefined): string | undefined => {
    if (!u) return undefined;
    try {
      return new URL(u, base).href;
    } catch {
      return u;
    }
  };
  return {
    ...result,
    favicon: resolve(result.favicon) as string,
    image: resolve(result.image) as string,
  };
}

function isYouTube(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host === "youtube.com" || host === "www.youtube.com" || host === "youtu.be";
}

export async function extractArticle(input: string): Promise<DefuddleResponse> {
  const url = assertSafeUrl(input);
  const initialUA = pickUserAgent(url);

  const html = await fetchHtml(url, initialUA);
  const result = await Defuddle(html, url.href);

  if (result.wordCount === 0 && !isYouTube(url) && initialUA !== BOT_UA) {
    try {
      const retryHtml = await fetchHtml(url, BOT_UA);
      const retry = await Defuddle(retryHtml, url.href);
      if (retry.wordCount > 0) return resolveUrls(retry, url.href);
    } catch {}
  }

  return resolveUrls(result, url.href);
}
