import "server-only";

interface MyMemoryResponse {
  responseStatus?: number;
  responseDetails?: string;
  quotaFinished?: boolean;
  responseData?: { translatedText?: string };
}

/**
 * Free machine translation via the MyMemory API (https://mymemory.translated.net).
 * No API key required. Anonymous quota is ~5,000 words/day per IP; setting the
 * optional MYMEMORY_EMAIL env var raises it to ~50,000 words/day.
 *
 * Returns null when the service is unavailable or quota is exhausted so callers
 * can fall back gracefully (the admin can always type the translation).
 */
export async function translateTo(target: "fr" | "en", source: string): Promise<string | null> {
  const text = source.trim();
  if (!text) return "";

  const from = target === "fr" ? "en" : "fr";
  const email = process.env.MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
    : "";
  const q = encodeURIComponent(text.slice(0, 1800));

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${q}&langpair=${from}|${target}${email}`,
      { signal: AbortSignal.timeout(15000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as MyMemoryResponse;
    if (data.responseStatus !== 200) return null;
    const translated = data.responseData?.translatedText?.trim();
    return translated ? translated : null;
  } catch {
    return null;
  }
}