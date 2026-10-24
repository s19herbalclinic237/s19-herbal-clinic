/**
 * S19-CARE donation funds, payment methods and the WhatsApp confirmation
 * message, from `docs/S19_CARE_Developer_Brief.md`.
 *
 * ## Why this exists
 *
 * The brief names three donation purposes and six payment methods, and it says
 * the same three purposes must appear on the public page *and* in the admin
 * donation log. Two copies of that list would drift apart the first time a fund
 * was renamed, and the admin log is a financial record: a drift there means a
 * donation is filed against a fund that no longer exists.
 *
 * So the list lives here, once, and both sides import it. The public page
 * renders it; the admin log filters and totals against it.
 *
 * ## Why the copy lives here and not in `lib/i18n.ts`
 *
 * `lib/i18n.ts` holds page chrome - labels, headings, buttons. The fund names
 * and their descriptions are approved prose that belongs to the brief, which is
 * the same shape as `lib/data/faq.ts` and `lib/data/programs.ts`, so they
 * follow the `...Fr` convention those files use rather than becoming another
 * dozen i18n keys.
 *
 * ## Why no payment details appear here
 *
 * The brief says: "Add an alternative payment-method WhatsApp button; do not
 * publish unapproved payment details." Only the MTN MoMo number is approved for
 * publication, and that lives in `lib/site.ts` as `CLINIC.phone` because it is
 * the clinic's real published contact number.
 *
 * The alternative methods below are therefore *names only*. There is no account
 * number, no handle, no IBAN - not here, not in the database, not in the
 * admin log. A number that is never written down cannot be published by
 * accident, which is the whole point of the rule.
 *
 * ## Why the reference code is a constant and not a string in the page
 *
 * "DONATION" is the payment reference code the donor types into Mobile Money.
 * It has to be identical on the public page, in the WhatsApp prefill and in
 * the admin log, or a payment arrives with no reference to match it against.
 */

import { CLINIC } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

/** Stable identifier for a donation purpose. Never localised, never renamed. */
export type DonationFundId = "patient-assistance" | "clinic-development" | "general";

export interface DonationFund {
  /** Stable id. Stored on every donation record. */
  readonly id: DonationFundId;
  /** Fund name in English, as published on the page and in the WhatsApp prefill. */
  readonly name: string;
  readonly nameFr: string;
  /** One-line description of what the fund pays for. */
  readonly description: string;
  readonly descriptionFr: string;
}

/**
 * The three donation purposes, in the order the brief lists them.
 *
 * Patient assistance comes first because it is the reason most people arrive
 * at the page: someone in the community needs treatment they cannot afford.
 */
export const DONATION_FUNDS: readonly DonationFund[] = [
  {
    id: "patient-assistance",
    name: "Patient Assistance Fund",
    nameFr: "Fonds d'assistance aux patients",
    description:
      "Helps eligible low-income patients and families with treatment plans, tests, transport, accommodation, mobile data, and related care needs.",
    descriptionFr:
      "Aide les patients et familles à faibles revenus éligibles avec les plans de traitement, les examens, le transport, l'hébergement, les données mobiles et les besoins liés aux soins.",
  },
  {
    id: "clinic-development",
    name: "S19 Development Fund",
    nameFr: "Fonds de développement S19",
    description:
      "Helps improve clinic equipment, infrastructure, training, education, outreach, and healthcare services.",
    descriptionFr:
      "Contribue à l'amélioration de l'équipement de la clinique, des infrastructures, de la formation, de l'éducation, de la sensitization et des services de santé.",
  },
  {
    id: "general",
    name: "General Donation",
    nameFr: "Don général",
    description:
      "Used where support is most needed, in line with the published donation policy.",
    descriptionFr:
      "Utilisé là où le soutien est le plus nécessaire, conformément à la politique de dons publiée.",
  },
] as const;

/** Stable identifier for a payment method. */
export type DonationPaymentMethodId =
  | "mtn-momo"
  | "orange-momo"
  | "cash-app"
  | "zelle"
  | "paypal"
  | "bank-transfer";

export interface DonationPaymentMethod {
  readonly id: DonationPaymentMethodId;
  readonly name: string;
  readonly nameFr: string;
  /**
   * `true` for MTN Mobile Money, the only method whose details are published
   * on the site. Everything else is arranged privately on WhatsApp.
   */
  readonly published: boolean;
}

/**
 * Payment methods a donor may ask about, in the order the brief lists them.
 *
 * MTN Mobile Money is the published, direct option; the rest are names only.
 */
export const DONATION_PAYMENT_METHODS: readonly DonationPaymentMethod[] = [
  { id: "mtn-momo", name: "MTN Mobile Money", nameFr: "MTN Mobile Money", published: true },
  { id: "orange-momo", name: "Orange Mobile Money", nameFr: "Orange Mobile Money", published: false },
  { id: "cash-app", name: "Cash App", nameFr: "Cash App", published: false },
  { id: "zelle", name: "Zelle", nameFr: "Zelle", published: false },
  { id: "paypal", name: "PayPal", nameFr: "PayPal", published: false },
  { id: "bank-transfer", name: "Bank transfer", nameFr: "Virement bancaire", published: false },
] as const;

/** The payment reference code the donor enters into Mobile Money. */
export const DONATION_REFERENCE_CODE = "DONATION";

/** The one MTN MoMo number approved for publication. */
export const DONATION_MOMO_NUMBER = CLINIC.phone;

/** The clinic's official WhatsApp number, in display form. */
export const DONATION_WHATSAPP_NUMBER = CLINIC.phone;

/**
 * The WhatsApp message the donor sends to confirm a donation.
 *
 * The brief specifies the shape:
 *
 *     DONATION | Purpose: [fund] | Amount: [amount] FCFA | Method: MTN MoMo | Screenshot attached.
 *
 * The reference code stays first and stays literal in both languages: it is
 * what staff match a payment against in the Mobile Money record, so it is not
 * translated. The labels around it are, because the donor reads them.
 *
 * The amount is optional. The brief says "send any amount to the MTN MoMo
 * number", and a donor who has not decided yet should still be able to open
 * WhatsApp with a usable message - so the amount segment is dropped rather
 * than left as a placeholder like "[amount]" that would reach the clinic
 * unedited.
 */
export function donationConfirmationMessage(options: {
  fundName: string;
  amount?: string | number;
  locale?: Locale;
}): string {
  const french = options.locale === "fr";
  const amount = options.amount === undefined ? "" : String(options.amount).trim();

  const segments: string[] = [
    DONATION_REFERENCE_CODE,
    `${french ? "Objet" : "Purpose"}: ${options.fundName}`,
  ];
  if (amount) {
    segments.push(`${french ? "Montant" : "Amount"}: ${amount} FCFA`);
  }
  segments.push(`${french ? "Méthode" : "Method"}: MTN MoMo`);
  segments.push(french ? "Capture d'écran jointe." : "Screenshot attached.");

  return segments.join(" | ");
}

/**
 * The message a donor sends to ask about a payment method the site does not
 * publish details for.
 *
 * Deliberately does not name a method: the brief says the team shares the
 * appropriate instructions, and naming one in the query would pin the reply to
 * a method the donor may not actually have set up.
 */
export function otherMethodsMessage(locale: Locale = "en"): string {
  return locale === "fr"
    ? "Bonjour Clinique S19, je souhaite faire un don. Pouvez-vous me partager les instructions de paiement pour une autre méthode que MTN Mobile Money ?"
    : "Hello S19 Herbal Clinic, I would like to make a donation. Could you share the payment instructions for a method other than MTN Mobile Money?";
}

/** Look up a fund by id. */
export function donationFund(id: string): DonationFund | undefined {
  return DONATION_FUNDS.find((f) => f.id === id);
}

/** Look up a payment method by id. */
export function donationPaymentMethod(id: string): DonationPaymentMethod | undefined {
  return DONATION_PAYMENT_METHODS.find((m) => m.id === id);
}

/** Localised fund name, falling back to English when a locale is missing. */
export function localizedFundName(fund: DonationFund, locale: Locale): string {
  return locale === "fr" ? fund.nameFr : fund.name;
}

/** Localised payment-method name, falling back to English. */
export function localizedPaymentMethodName(method: DonationPaymentMethod, locale: Locale): string {
  return locale === "fr" ? method.nameFr : method.name;
}
