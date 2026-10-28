const MAX_SIZE = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

const DEFAULT_UA = "Mozilla/5.0 (compatible; Ondoku/1.0; +https://ondoku.app)";
const BOT_UA = `${DEFAULT_UA} bot`;

// Domains that serve better content to bot user agents (SSR vs client-rendered).
const BOT_UA_DOMAINS = new Set(["github.com"]);

const PRIVATE_IP_RE =
  /^(?:10\.|127\.|192\.168\.|169\.254\.|0\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/;
const PRIVATE_HOSTS = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);

export function assertSafeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported");
  }
  const host = url.hostname.toLowerCase();
  if (
    PRIVATE_HOSTS.has(host) ||
    PRIVATE_IP_RE.test(host) ||
    host.endsWith(".local")
  ) {
    throw new Error("Private hosts are not allowed");
  }
  return url;
}

export function pickUserAgent(url: URL): string {
  const host = url.hostname.toLowerCase();
  for (const domain of BOT_UA_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return BOT_UA;
  }
  return DEFAULT_UA;
}

export { BOT_UA, DEFAULT_UA };

export async function fetchHtml(url: URL, userAgent: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error(`Not an HTML page (content-type: ${contentType})`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      if (bytes > MAX_SIZE) {
        throw new Error(
          `Page too large (${Math.round(bytes / 1024 / 1024)}MB, max 5MB)`,
        );
      }
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      throw new Error(
        `Page too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB, max 5MB)`,
      );
    }

    return decodeHtml(buffer, contentType);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Timed out fetching page after ${FETCH_TIMEOUT_MS / 1000}s`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtml(buffer: ArrayBuffer, contentType: string): string {
  const charset = detectCharset(contentType, buffer);
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function detectCharset(contentType: string, buffer: ArrayBuffer): string {
  const headerMatch = contentType.match(/charset=["']?([^\s;,"']+)/i);
  if (headerMatch) return headerMatch[1].toLowerCase();

  const head = new TextDecoder("latin1").decode(buffer.slice(0, 1024));
  const metaCharset = head.match(/<meta[^>]+charset=["']?([^\s"';>]+)/i);
  if (metaCharset) return metaCharset[1].toLowerCase();

  const metaHttpEquiv = head.match(
    /<meta[^>]+content=["'][^"']*charset=([^\s"';]+)/i,
  );
  if (metaHttpEquiv) return metaHttpEquiv[1].toLowerCase();

  // Heuristic byte scan: bytes in 0x80–0x9F that aren't valid UTF-8 leads
  // suggest windows-1252; valid multi-byte UTF-8 sequences suggest utf-8.
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8192));
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0x80 && b <= 0x9f) return "windows-1252";
    if (b >= 0xc0 && b <= 0xf7) {
      const seqLen = b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
      let valid = true;
      for (let j = 1; j < seqLen && i + j < bytes.length; j++) {
        if ((bytes[i + j] & 0xc0) !== 0x80) {
          valid = false;
          break;
        }
      }
      if (valid) {
        i += seqLen - 1;
        continue;
      }
      return "windows-1252";
    }
  }
  return "utf-8";
}
