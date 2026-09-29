import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { User } from "@/lib/models/User";
import { WHATSAPP_TEMPLATES, whatsappConfigured, whatsappTemplateName } from "@/lib/whatsapp";

/**
 * WhatsApp setup status for the admin panel: whether the Cloud API credentials
 * are present, how many patients have opted in, and the exact template names
 * that must exist in the WhatsApp Manager. Secrets are never returned.
 */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "WhatsApp status is temporarily unavailable." }, { status: 503 });
  }

  const optedIn = await User.countDocuments({ whatsappOptIn: true });
  const withUsableNumber = await User.countDocuments({
    whatsappOptIn: true,
    phoneSearch: { $exists: true, $nin: [null, ""] },
  });

  return NextResponse.json({
    configured: whatsappConfigured(),
    optedIn,
    withUsableNumber,
    templates: Object.entries(WHATSAPP_TEMPLATES).map(([key, spec]) => ({
      key,
      name: whatsappTemplateName(key as keyof typeof WHATSAPP_TEMPLATES),
      params: spec.params,
      en: spec.en,
      fr: spec.fr,
    })),
  });
}
