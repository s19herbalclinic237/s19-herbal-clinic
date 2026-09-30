import "server-only";

import { CLINIC } from "@/lib/site";
import { normalizePhone } from "@/lib/auth";
import {
  WHATSAPP_TEMPLATES,
  buildButtonPayload,
  templateButtons,
  type WhatsAppLanguage,
  type WhatsAppTemplate,
} from "@/lib/whatsapp-templates";

/**
 * WhatsApp Cloud API (Meta) notifications.
 *
 * Meta only allows free-form text inside the 24-hour customer service window,
 * and this app's messages are all business-initiated (an appointment changed, an
 * order shipped, a prescription was issued). Every send therefore uses a
 * Meta-approved template, which must be created once in the WhatsApp Manager
 * and is listed in `lib/whatsapp-templates.ts`.
 *
 * The template catalogue and the button grammar live in their own module because
 * they are data, and data has to be testable. This file is only the socket.
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

export { WHATSAPP_TEMPLATES, buildButtonPayload, templateButtons };
export type { WhatsAppLanguage, WhatsAppTemplate };
export {
  WHATSAPP_ACTIONS,
  WHATSAPP_OPT_OUT_LINE,
  parseButtonPayload,
  type WhatsAppAction,
  type WhatsAppButtonSpec,
} from "@/lib/whatsapp-templates";

export function whatsappConfigured(): boolean {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID);
}

/**
 * Whether the sending credentials are set.
 *
 * Separate from `whatsappConfigured` for M2's benefit: the tick needs to distinguish
 * "the clinic has not given us credentials yet" from "Meta rejected this message",
 * because the first is a configuration gap that affects every patient and the second
 * is specific to one. Reporting both as "send failed" produces five pointless attempts
 * per message and a failure row for the whole clinic.
 *
 * Evaluated per call rather than cached at module load, so the answer is right in a
 * long-lived process whose environment did not change, and after a deploy that added
 * the variables.
 */
export function whatsappSendingConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
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

/** What Meta said about one send attempt. */
export interface WhatsAppSendResult {
  ok: boolean;
  /**
   * Meta's message id for an accepted send, or null.
   *
   * Needed by M2's outbox, which records the message against this id so it can be
   * shown in the thread and reconciled against the delivery status Meta later reports.
   * Absent from the original `sendWhatsAppTemplate` contract, which returned a bare
   * boolean and so could not record anything.
   */
  wamid: string | null;
  /** Meta's HTTP status, when there was one. 0 means the request never completed. */
  status: number;
  /** Truncated response body, for the log. Never contains a credential. */
  detail?: string;
}

/**
 * Sends an approved template to one recipient.
 *
 * Returns a result rather than a boolean, and never throws: a bad token or an
 * unapproved template must not fail the request that triggered the notification.
 * Callers that only need "did it go" can use `sendWhatsAppTemplate`, which is this
 * function reduced to its boolean.
 */
export async function sendWhatsAppTemplateResult(opts: {
  to: string | null | undefined;
  template: WhatsAppTemplate;
  params: string[];
  language?: string | null;
}): Promise<WhatsAppSendResult> {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return { ok: false, wamid: null, status: 0 };
  const to = normalizeWhatsAppNumber(opts.to);
  if (!to) return { ok: false, wamid: null, status: 0 };

  const spec = WHATSAPP_TEMPLATES[opts.template];
  const language: WhatsAppLanguage = opts.language === "fr" ? "fr" : "en";
  // Fill exactly the placeholders the template declares; a short params array
  // would send literal empty values to the patient.
  const parameters = spec.params.map((_, i) => ({
    type: "text",
    text: (opts.params[i] ?? "").trim().slice(0, 1024),
  }));

  try {
    // Quick-reply buttons are addressed by *position*, not by label: Meta's
    // `index` counts from zero in the order the buttons were created in the
    // WhatsApp Manager, and only the payload is sent - the label is already
    // stored on the approved template.
    //
    // That makes the order in `templateButtons()` load-bearing. If the clinic
    // reorders the buttons on a live template, the payload for "ask a question"
    // would be delivered as the tap on "stop these messages". The mismatch is
    // silent: the send succeeds and the patient is unsubscribed. So the order is
    // defined once, in the catalogue, and `GET /api/admin/whatsapp` prints the
    // buttons in that order for the clinic to create them in.
    const buttons = templateButtons(opts.template);
    const components: Record<string, unknown>[] = [{ type: "body", parameters }];
    if (buttons.length > 0) {
      components.push({
        type: "buttons",
        buttons: buttons.map((button, index) => ({
          type: "quick_reply",
          index,
          parameters: [{ type: "payload", payload: buildButtonPayload(button.action) }],
        })),
      });
    }

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
            components,
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
      return { ok: false, wamid: null, status: res.status, detail: detail.slice(0, 500) };
    }

    // Meta returns the message id in the body of a successful send. It is parsed
    // rather than trusted: a 200 with an unparseable body is not a send this
    // application can reconcile against later delivery statuses, so it is reported
    // as a failure rather than silently recorded with no id.
    let wamid: string | null = null;
    try {
      const body: unknown = await res.json();
      const candidate = (body as { messages?: { id?: unknown }[] } | null)?.messages?.[0]?.id;
      wamid = typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
    } catch {
      wamid = null;
    }

    if (!wamid) {
      return {
        ok: false,
        wamid: null,
        status: res.status,
        detail: "Meta accepted the send but returned no message id, so it cannot be recorded.",
      };
    }

    return { ok: true, wamid, status: res.status };
  } catch (error) {
    console.error("[whatsapp] send threw:", { template: opts.template, error });
    return { ok: false, wamid: null, status: 0 };
  }
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
  const result = await sendWhatsAppTemplateResult(opts);
  return result.ok;
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
