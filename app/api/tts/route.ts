import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
const MAX_TEXT_LENGTH = 5000;

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return new Response("ElevenLabs API key not configured", { status: 500 });
  }

  const { text, previousText, nextText } = await req.json();

  if (!text || typeof text !== "string") {
    return new Response("Missing text", { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(`Text exceeds ${MAX_TEXT_LENGTH} character limit`, { status: 400 });
  }

  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  try {
    const stream = await client.textToSpeech.convert(VOICE_ID, {
      text,
      modelId: "eleven_turbo_v2_5",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
      ...(previousText && { previousText }),
      ...(nextText && { nextText }),
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: { detail?: { message?: string } } };
    const message = err.body?.detail?.message ?? String(e);
    const status = err.statusCode ?? 500;
    return new Response(message, { status });
  }
}
