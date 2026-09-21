import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { translateTo } from "@/lib/translate";

/**
 * POST /api/translate
 * Used by the admin testimonial tools to auto-translate EN <-> FR via the free
 * MyMemory API, so admins don't have to type both versions by hand.
 * Admin-only to protect the free quota.
 */
export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: { text?: unknown; target?: unknown };
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  const target = body.target === "en" ? "en" : "fr";
  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Provide between 1 and 2000 characters to translate." },
      { status: 400 }
    );
  }

  const translated = await translateTo(target, text);
  if (translated === null) {
    return NextResponse.json(
      { error: "The free translation service is unavailable right now. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ translated });
}