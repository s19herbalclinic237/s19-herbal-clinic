/**
 * The WhatsApp template catalogue, and the button-payload grammar.
 *
 * ## Why this lives outside `lib/whatsapp.ts`
 *
 * The catalogue is *data*, and data is what the rest of the automation is allowed
 * to reason about. `lib/whatsapp.ts` holds the socket to Meta and imports
 * `server-only`, so nothing in the test suite can reach the templates. Keeping
 * them here means the button grammar, the placeholder order and the multilingual
 * copy are all directly testable, and `lib/whatsapp.ts` is reduced to "how do I
 * make an HTTP call".
 *
 * ## Why buttons at all
 *
 * This project has no language model anywhere. Intent therefore cannot be
 * *inferred*; it has to be *stated*. Free text "yes please" is ambiguous between
 * confirming an appointment, asking about a fee and cancelling. A Quick Reply
 * button removes the ambiguity entirely: tapping one returns a fixed payload the
 * code matches exactly, with no guessing and no chance of a wrong answer about a
 * fee or a dosage.
 *
 * This is the difference between an assistant that can be trusted on a clinical
 * question and one that cannot. The buttons are not a convenience - they are what
 * makes automation safe here.
 *
 * ## The payload grammar
 *
 * Every button payload is `s19:<action>`, where `<action>` is drawn from
 * `WHATSAPP_ACTIONS`. The `s19:` prefix reserves a namespace inside WhatsApp's
 * payload field, so a clinic-authored button can never be confused with a payload
 * invented by something else, and an unrecognised prefix is rejected rather than
 * guessed at.
 *
 * M1 defines the grammar and the parser. M13 supplies the *content* — which
 * questions are answerable, and what the answers are. Until M13 exists, tapping a
 * button is recorded faithfully and handed to a human. Nothing is interpreted.
 */

export type WhatsAppLanguage = "en" | "fr";

/**
 * The reserved vocabulary of button payloads.
 *
 * Closed on purpose. An action that is not in this list cannot be produced by a
 * clinic-authored button, and a payload outside the list is treated as
 * unrecognised - which routes to a human rather than to a guess.
 */
export const WHATSAPP_ACTIONS = [
  /** Patient tapped "Got it". No state change; acknowledged. */
  "confirm",
  /** Patient tapped "Ask a question". Opens free text; M13 answers. */
  "question",
  /** Patient tapped "Speak to the clinic". Hard hand-off to a human. */
  "human",
  /** Patient tapped "Stop these messages". Meta's opt-out requirement. */
  "stop",
  /** Patient tapped to move an appointment. M5. */
  "reschedule",
  /** Patient tapped to order more. M4. */
  "refill",
  /** Patient tapped to follow an order. M16 / existing track page. */
  "track",
] as const;

export type WhatsAppAction = (typeof WHATSAPP_ACTIONS)[number];

/** Namespace prefix for every button payload this application emits. */
export const WHATSAPP_PAYLOAD_PREFIX = "s19:";

/** Longest payload accepted. WhatsApp caps button ids at 256 characters. */
export const WHATSAPP_PAYLOAD_MAX = 256;

/**
 * Builds the wire payload for a button.
 *
 * Validated rather than concatenated, because a typo here becomes a button the
 * patient can tap and the application cannot answer - a dead end presented to
 * someone who is trying to reach their clinic.
 */
export function buildButtonPayload(action: WhatsAppAction): string {
  if (!WHATSAPP_ACTIONS.includes(action)) {
    throw new Error(`Unknown WhatsApp action: ${String(action)}`);
  }
  return `${WHATSAPP_PAYLOAD_PREFIX}${action}`;
}

export type ParsedPayload =
  | { kind: "action"; action: WhatsAppAction }
  /** A payload from outside this namespace. Recorded, never acted on. */
  | { kind: "foreign"; raw: string }
  /** Not a payload at all: empty, over-long, or the wrong shape. */
  | { kind: "invalid"; raw: string };

/**
 * Parses a button reply payload.
 *
 * Three outcomes, deliberately distinguishable. A `foreign` payload is a real
 * button from a real template that this version of the code does not know about -
 * a template edited in the WhatsApp Manager after deployment, most likely. It is
 * recorded and handed to a human. Treating it as `invalid` and silently dropping
 * it would mean a patient taps a button the clinic can see and nothing happens.
 */
export function parseButtonPayload(raw: unknown): ParsedPayload {
  if (typeof raw !== "string") return { kind: "invalid", raw: "" };
  const value = raw.trim();
  if (!value || value.length > WHATSAPP_PAYLOAD_MAX) return { kind: "invalid", raw: value };

  if (!value.startsWith(WHATSAPP_PAYLOAD_PREFIX)) return { kind: "foreign", raw: value };

  const action = value.slice(WHATSAPP_PAYLOAD_PREFIX.length);
  return WHATSAPP_ACTIONS.includes(action as WhatsAppAction)
    ? { kind: "action", action: action as WhatsAppAction }
    : { kind: "foreign", raw: value };
}

export interface WhatsAppButtonSpec {
  /** The reserved action. Determines what the tap means. */
  action: WhatsAppAction;
  en: string;
  fr: string;
}

/**
 * Meta allows at most three quick-reply buttons per template.
 *
 * Exceeding it is not a runtime error, it is a template that Meta rejects at
 * creation time - so the catalogue is checked in the test suite instead, where
 * the failure is a red test rather than a support ticket.
 */
export const MAX_TEMPLATE_BUTTONS = 3;

/** Labels for the buttons shared across templates, so wording stays consistent. */
const COMMON_BUTTONS = {
  question: { action: "question", en: "Ask a question", fr: "Poser une question" },
  human: { action: "human", en: "Speak to the clinic", fr: "Parler à la clinique" },
  stop: { action: "stop", en: "Stop these messages", fr: "Arrêter ces messages" },
} as const satisfies Record<string, WhatsAppButtonSpec>;

export interface WhatsAppTemplateSpec {
  /** Ordered body placeholders, filled positionally by `lib/whatsapp.ts`. */
  readonly params: readonly string[];
  readonly en: string;
  readonly fr: string;
  readonly buttons?: readonly WhatsAppButtonSpec[];
}

/**
 * The exact templates to create in the WhatsApp Manager, with the sample body
 * copy to paste in. `params` is the ordered list of body placeholders this app
 * fills in; the {{n}} markers in the sample text are Meta's numbering.
 *
 * The placeholder order is fixed in code and filled positionally. A live template
 * whose placeholders are in a different order will not fail - it will read wrong,
 * sending a patient a date where their name belongs. That is why
 * `GET /api/admin/whatsapp` is the authority for what to create.
 */
export const WHATSAPP_TEMPLATES = {
  appointment_booked: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your appointment at S19 Herbal Clinic is booked for {{2}} at {{3}}. The clinic will confirm it shortly.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 est réservé le {{2}} à {{3}}. La clinique le confirmera prochainement.",
    buttons: [
      { action: "confirm", en: "Got it", fr: "C'est noté" },
      COMMON_BUTTONS.question,
      COMMON_BUTTONS.stop,
    ],
  },
  appointment_confirmed: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your appointment at S19 Herbal Clinic is confirmed for {{2}} at {{3}}. See you then.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 est confirmé le {{2}} à {{3}}. À bientôt.",
    buttons: [
      { action: "reschedule", en: "Change the time", fr: "Changer l'heure" },
      COMMON_BUTTONS.question,
      COMMON_BUTTONS.stop,
    ],
  },
  appointment_rescheduled: {
    params: ["name", "date", "time"],
    en: "Hello {{1}}, your S19 Herbal Clinic appointment has moved to {{2}} at {{3}}. Reply here if that does not suit you.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 a été déplacé au {{2}} à {{3}}. Répondez ici si cela ne vous convient pas.",
    buttons: [
      { action: "confirm", en: "That works", fr: "Cela me convient" },
      { action: "reschedule", en: "Change it again", fr: "Le changer encore" },
      COMMON_BUTTONS.stop,
    ],
  },
  appointment_cancelled: {
    params: ["name", "date"],
    en: "Hello {{1}}, your S19 Herbal Clinic appointment on {{2}} has been cancelled. Book again at s19herbalclinic.com when you are ready.",
    fr: "Bonjour {{1}}, votre rendez-vous à la Clinique S19 du {{2}} a été annulé. Reprenez rendez-vous sur s19herbalclinic.com.",
    buttons: [COMMON_BUTTONS.question, COMMON_BUTTONS.stop],
  },
  order_placed: {
    params: ["name", "reference"],
    en: "Hello {{1}}, we have received your order {{2}}. We will let you know when it is ready.",
    fr: "Bonjour {{1}}, nous avons bien reçu votre commande {{2}}. Nous vous préviendrons quand elle sera prête.",
    buttons: [
      { action: "track", en: "Track my order", fr: "Suivre ma commande" },
      COMMON_BUTTONS.question,
      COMMON_BUTTONS.stop,
    ],
  },
  order_status: {
    params: ["name", "reference", "status"],
    en: "Hello {{1}}, your order {{2}} is now: {{3}}. Track it at s19herbalclinic.com/track.",
    fr: "Bonjour {{1}}, votre commande {{2}} est maintenant : {{3}}. Suivez-la sur s19herbalclinic.com/track.",
    buttons: [
      { action: "track", en: "Track my order", fr: "Suivre ma commande" },
      COMMON_BUTTONS.human,
      COMMON_BUTTONS.stop,
    ],
  },
  prescription_issued: {
    params: ["name", "medications"],
    en: "Hello {{1}}, the clinic issued a new prescription for you: {{2}}. Open your dashboard to see the dosage and the photos of each product.",
    fr: "Bonjour {{1}}, la clinique vous a prescrit une nouvelle ordonnance : {{2}}. Ouvrez votre tableau de bord pour voir la posologie et les photos de chaque produit.",
    buttons: [
      { action: "refill", en: "Order more", fr: "Commander plus" },
      COMMON_BUTTONS.question,
      COMMON_BUTTONS.human,
    ],
  },
  record_added: {
    params: ["name", "title"],
    en: "Hello {{1}}, the clinic added a new medical record to your file: {{2}}. Open your dashboard to read it.",
    fr: "Bonjour {{1}}, la clinique a ajouté un nouveau dossier médical à votre dossier : {{2}}. Ouvrez votre tableau de bord pour le lire.",
    buttons: [COMMON_BUTTONS.question, COMMON_BUTTONS.human],
  },
  treatment_plan: {
    params: ["name", "title", "startDate"],
    en: "Hello {{1}}, your treatment plan {{2}} starts on {{3}}. Open your dashboard to follow your daily tasks.",
    fr: "Bonjour {{1}}, votre plan de traitement {{2}} commence le {{3}}. Ouvrez votre tableau de bord pour suivre vos tâches quotidiennes.",
    buttons: [
      { action: "confirm", en: "Got it", fr: "C'est noté" },
      COMMON_BUTTONS.question,
      COMMON_BUTTONS.human,
    ],
  },
  clinic_message: {
    params: ["name", "subject"],
    en: "Hello {{1}}, the clinic sent you a message about {{2}}. Read it in your dashboard messages.",
    fr: "Bonjour {{1}}, la clinique vous a envoyé un message au sujet de {{2}}. Lisez-le dans vos messages du tableau de bord.",
    buttons: [COMMON_BUTTONS.question, COMMON_BUTTONS.human, COMMON_BUTTONS.stop],
  },
} as const satisfies Record<string, WhatsAppTemplateSpec>;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;

/**
 * The line every template body must contain, in both languages.
 *
 * Meta requires a working opt-out, and the only mechanism available for a
 * utility template is the patient replying. The body has to say so, because a
 * patient cannot discover a keyword they were never told.
 *
 * Held as a constant rather than written into the ten bodies so the wording is
 * decided once. It is reported by `GET /api/admin/whatsapp` and has to be pasted
 * into each template by hand at creation time. It is **not** appended
 * automatically: the clinic's templates are its own approved copy, and a
 * compliance line silently injected into an approved artefact is worse than one
 * the clinic is told to add.
 */
export const WHATSAPP_OPT_OUT_LINE = {
  en: " Reply STOP to stop these messages.",
  fr: " Répondez STOP pour arrêter ces messages.",
} as const;

/** The button rows a template should be created with, in order. */
export function templateButtons(template: WhatsAppTemplate): readonly WhatsAppButtonSpec[] {
  return WHATSAPP_TEMPLATES[template].buttons ?? [];
}
