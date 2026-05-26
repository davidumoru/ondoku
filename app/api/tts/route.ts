import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
const MAX_TEXT_LENGTH = 5000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

interface TtsRequest {
  text: string;
  previousText?: string;
  nextText?: string;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count++;
  return true;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isValidRequest(body: unknown): body is TtsRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.text !== "string" || !b.text) return false;
  if (b.previousText !== undefined && typeof b.previousText !== "string") return false;
  if (b.nextText !== undefined && typeof b.nextText !== "string") return false;
  return true;
}

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return new Response("ElevenLabs API key not configured", { status: 500 });
  }

  if (!rateLimit(clientIp(req))) {
    return new Response("Too many requests", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isValidRequest(body)) {
    return new Response("Missing or invalid text", { status: 400 });
  }
  if (body.text.length > MAX_TEXT_LENGTH) {
    return new Response(`Text exceeds ${MAX_TEXT_LENGTH} character limit`, { status: 400 });
  }

  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  try {
    const result = await client.textToSpeech.convertWithTimestamps(VOICE_ID, {
      text: body.text,
      modelId: "eleven_turbo_v2_5",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
      ...(body.previousText && { previousText: body.previousText }),
      ...(body.nextText && { nextText: body.nextText }),
    });

    return Response.json({
      audioBase64: result.audioBase64,
      alignment: result.alignment ?? result.normalizedAlignment ?? null,
    });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: { detail?: { message?: string } } };
    return new Response(err.body?.detail?.message ?? String(e), {
      status: err.statusCode ?? 500,
    });
  }
}
