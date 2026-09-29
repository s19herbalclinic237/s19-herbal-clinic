import "server-only";

import { CLINIC } from "@/lib/site";
import { normalizePhone } from "@/lib/auth";

/**
 * WhatsApp Cloud API (Meta) notifications.
 *
 * Meta only allows free-form text inside the 24-hour customer service window,
 * and this app's messages are all business-initiated (an appointment changed, an
 * order shipped, a prescription was issued). Every send therefore uses a
 * Meta-approved template, which must be created once in the WhatsApp Manager
 * and is listed in WHATSAPP_TEMPLATES below.
 *
 * This module mirrors lib/email.ts: callers fire it without awaiting the result
 * of the business action, and a misconfigured or failing WhatsApp account can
 * never break the request that triggered the notification.
 *
 * Environment variables (all optional - sending is a no-op until they are set):
 *   WHATSAPP_ACCESS_TOKEN    permanent System User token for the WABA
 *   WHATSAPP_PHONE_NUMBER_ID id of the sending number
 *   WHATSAPP_GRAPH_VERSION   defaults to v23.0
 *   WHATSAPP_NAMESPACE       template name prefix, defaults to "s19"
 *
 * Templates must exist in both `en` and `fr` for bilingual delivery; a missing
 * French version falls back to English rather than failing silently.
 */

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const NAMESPACE = (process.env.WHATSAPP_NAMESPACE || "s19").replace(/[^a-z0-9_]/gi, "");

export type WhatsAppLanguage = "en" | "fr";

/**
 * The exact templates to create in the WhatsApp Manager, with the sample body
 * copy to paste in. `params` is the ordered list of body placeholders this app
 * fills in; the {{n}} markers in the sample text are Meta's numbering.
 */
export const WHATSAPP_TEMPLATES = {
  appointment_booked: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your appointment at S19 Herbal Clinic is booked for {{2}} at {{3}}. The clinic will confirm it shortly.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 est réservé le {{2}} à {{3}}. La clinique le confirmera prochainement.",
  },
  appointment_confirmed: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your appointment at S19 Herbal Clinic is confirmed for {{2}} at {{3}}. See you then.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 est confirmé le {{2}} à {{3}}. À bientôt.",
  },
  appointment_rescheduled: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your S19 Herbal Clinic appointment has moved to {{2}} at {{3}}. Reply here if that does not suit you.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 a été déplacé au {{2}} à {{3}}. Répondez ici si cela ne vous convient pas.",
  },
  appointment_cancelled: {
    params: ["name", "date"],
    en: "Hello {{1}}, your S19 Herbal Clinic appointment on {{2}} has been cancelled. Book again at s19herbalclinic.com when you are ready.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 du {{2}} a été annulé. Reprenez rendez-vous sur s19herbalclinic.com.",
  },
  order_placed: {
    params: ["name", "reference"],
    en: "Hello {{1}}, we have received your order {{2}}. We will let you know when it is ready.",
    fr: "Bonjour {{1}}, nous avons bien reçu votre commande {{2}}. Nous vous préviendrons quand elle sera prête.",
  },
  order_status: {
    params: ["name", "reference", "status"],
    en: "Hello {{1}}, your order {{2}} is now: {{3}}. Track it at s19herbalclinic.com/track.",
    fr: "Bonjour {{1}}, votre commande {{2}} est maintenant : {{3}}. Suivez-la sur s19herbalclinic.com/track.",
  },
  prescription_issued: {
    params: ["name", "medications"],
    en: "Hello {{1}}, the clinic issued a new prescription for you: {{2}}. Open your dashboard to see the dosage and the photos of each product.",
    fr: "Bonjour {{1}}, la clinique vous a prescrit une nouvelle ordonnance : {{2}}. Ouvrez votre tableau de bord pour voir la posologie et les photos de chaque produit.",
  },
  record_added: {
    params: ["name", "title"],
    en: "Hello {{1}}, the clinic added a new medical record to your file: {{2}}. Open your dashboard to read it.",
    fr: "Bonjour {{1}}, la clinique a ajouté un nouveau dossier médical à votre dossier : {{2}}. Ouvrez votre tableau de bord pour le lire.",
  },
  treatment_plan: {
    params: ["name", "title", "startDate"],
    en: "Hello {{1}}, your treatment plan {{2}} starts on {{3}}. Open your dashboard to follow your daily tasks.",
    fr: "Bonjour {{1}}, votre plan de traitement {{2}} commence le {{3}}. Ouvrez votre tableau de bord pour suivre vos tâches quotidiennes.",
  },
  clinic_message: {
    params: ["name", "subject"],
    en: "Hello {{1}}, the clinic sent you a message about {{2}}. Read it in your dashboard messages.",
    fr: "Bonjour {{1}}, la clinique vous a envoyé un message au sujet de {{2}}. Lisez-le dans vos messages du tableau de bord.",
  },
} as const satisfies Record<string, { params: readonly string[]; en: string; fr: string }>;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;

export function whatsappConfigured(): boolean {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID);
}

/** The fully-qualified template name to create in the WhatsApp Manager. */
export function whatsappTemplateName(template: WhatsAppTemplate): string {
  return `${NAMESPACE}_${template}`;
}

/** Digits-only international number, or null when it cannot be used. */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = normalizePhone(raw || "");
  // E.164 allows 8-15 digits. Anything shorter is almost certainly a local
  // number typed without a country code, which Meta would reject.
  if (digits.length < 8 || digits.length > 15) return null;
  // Never message the clinic's own line: that is how a loop starts.
  if (digits === CLINIC.whatsappNumber) return null;
  return digits;
}

export interface WhatsAppRecipient {
  phoneSearch?: string | null;
  phone?: string | null;
  whatsappOptIn?: boolean | null;
  preferredLanguage?: string | null;
}

/** Templates address patients by first name, never by their full name. */
export function whatsappFirstName(name: string | null | undefined): string {
  return (name || "").trim().split(/\s+/)[0] || "there";
}

/** "12 Mar 2026, 14:30" in English, "12 mars 2026 à 14:30" in French. */
export function whatsappDate(value: string | Date | null | undefined, language: WhatsAppLanguage): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "fr") {
    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "12 Mar 2026" / "12 mars 2026" - for templates with no time component. */
export function whatsappDay(value: string | Date | null | undefined, language: WhatsAppLanguage): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "fr") {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Sends an approved template to one recipient. Returns false (never throws) so
 * a bad token or an unapproved template cannot fail the caller.
 */
export async function sendWhatsAppTemplate(opts: {
  to: string | null | undefined;
  template: WhatsAppTemplate;
  params: string[];
  language?: string | null;
}): Promise<boolean> {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return false;
  const to = normalizeWhatsAppNumber(opts.to);
  if (!to) return false;

  const spec = WHATSAPP_TEMPLATES[opts.template];
  const language: WhatsAppLanguage = opts.language === "fr" ? "fr" : "en";
  // Fill exactly the placeholders the template declares; a short params array
  // would send literal empty values to the patient.
  const parameters = spec.params.map((_, i) => ({
    type: "text",
    text: (opts.params[i] ?? "").trim().slice(0, 1024),
  }));

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: whatsappTemplateName(opts.template),
            language: { code: language },
            components: [{ type: "body", parameters }],
          },
        }),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[whatsapp] send failed:", {
        template: opts.template,
        language,
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] send threw:", { template: opts.template, error });
    return false;
  }
}

/**
 * The opt-in gate every notification goes through. Skips silently when the
 * feature is not configured, the patient has not opted in, or no usable phone
 * number is on file - all normal states, not errors.
 */
export async function notifyPatientWhatsApp(
  recipient: WhatsAppRecipient | null | undefined,
  opts: { template: WhatsAppTemplate; params: string[] }
): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  if (!recipient?.whatsappOptIn) return false;
  return sendWhatsAppTemplate({
    to: recipient.phoneSearch || recipient.phone,
    template: opts.template,
    params: opts.params,
    language: recipient.preferredLanguage,
  });
}
