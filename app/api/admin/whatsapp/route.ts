import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { User } from "@/lib/models/User";
import {
  WHATSAPP_OPT_OUT_LINE,
  WHATSAPP_TEMPLATES,
  templateButtons,
  whatsappConfigured,
  whatsappTemplateName,
  type WhatsAppTemplate,
} from "@/lib/whatsapp";

/**
 * WhatsApp setup status for the admin panel: whether the credentials are present,
 * how many patients have opted in, and the exact template names that must exist
 * in the WhatsApp Manager. Secrets are never returned.
 *
 * ## What this endpoint is for
 *
 * It is the authority for *what to create in Meta*. Getting a template wrong does
 * not fail loudly at send time - a placeholder order mismatch sends a patient a
 * date where their name belongs, and a reordered button delivers the payload for
 * "ask a question" as the tap on "stop these messages". Both are silent. So the
 * bodies, the parameter order and the button order are printed here, in the order
 * the code will use them, and the clinic copies from this page rather than from
 * memory.
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
    /** Can this deployment send? */
    configured: whatsappConfigured(),
    /**
     * Can it receive? Reported separately, because these are four different
     * variables and the failure modes are completely different. A clinic that
     * configured sending but not receiving believes replies are being handled,
     * and they are being discarded.
     */
    inbound: {
      appSecret: Boolean(process.env.WHATSAPP_APP_SECRET?.trim()),
      verifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim()),
      url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/api/webhooks/whatsapp`,
    },
    optedIn,
    withUsableNumber,
    /**
     * Meta requires a working opt-out on a utility template, and the only
     * mechanism is the patient replying - which they cannot discover unless the
     * body says so. Printed per language so it is pasted into every template.
     */
    optOutLine: WHATSAPP_OPT_OUT_LINE,
    templates: Object.entries(WHATSAPP_TEMPLATES).map(([key, spec]) => ({
      key,
      name: whatsappTemplateName(key as WhatsAppTemplate),
      params: spec.params,
      en: spec.en,
      fr: spec.fr,
      // Order is load-bearing. Meta addresses a quick reply by its index in the
      // template, so reordering these on a live template silently delivers the
      // wrong payload to the wrong button.
      buttons: templateButtons(key as WhatsAppTemplate).map((button, index) => ({
        index,
        action: button.action,
        payload: `s19:${button.action}`,
        en: button.en,
        fr: button.fr,
      })),
    })),
  });
}
