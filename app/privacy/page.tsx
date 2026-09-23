import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("privacy.metaTitle"),
    description: t("privacy.metaDescription"),
  };
}

const sectionKeys = [
  "privacy.section.info",
  "privacy.section.use",
  "privacy.section.profile",
  "privacy.section.health",
  "privacy.section.telemedicine",
  "privacy.section.family",
  "privacy.section.payments",
  "privacy.section.cookies",
  "privacy.section.transfers",
  "privacy.section.marketing",
  "privacy.section.rights",
  "privacy.section.retention",
  "privacy.section.complaints",
] as const;

const sections = [
  {
    body: "When you use this website we collect the information you provide, including your name, phone number, email address, delivery address, order details, health information shared in consultation or assessment forms, and technical data such as pages visited so we can improve the site.",
  },
  {
    body: "Your information is used to respond to assessment and consultation requests, confirm and deliver orders, book and manage appointments, coordinate telemedicine sessions, issue and track medical records and prescriptions, send appointment and order notifications by email or WhatsApp, and provide follow-up care. We never sell or rent your personal data.",
  },
  {
    body: `In your account you may add profile information such as date of birth, gender, home address, an emergency contact, and identification documents (front and back of a national ID, passport or birth certificate). We use these to identify you safely, confirm appointments and, when present, to contact your emergency contact. Documents are stored securely, are visible only to authorised clinic staff, and you can view, replace or remove them at any time from your settings.`,
  },
  {
    body: "Health information - including medical records, visit notes, diagnoses, lab results, scans, prescriptions and appointment details - is treated as strictly confidential. It is only visible to S19 clinic staff involved in your care and is stored securely. It is never shared with third parties without your consent, except where required by law.",
  },
  {
    body: "Video consultations take place over secure meeting links. Sessions are not recorded or stored, and call metadata (who, when, duration) is kept only for appointment purposes. We may ask you to confirm your identity before a session. If you join from a shared or public device, make sure you sign out of your account afterwards.",
  },
  {
    body: "When you add a family member such as a child, we process that person's basic details (name, date of birth where provided, gender, relationship) under your authority as account holder and your confirmation that you may share their information. Records and prescriptions prepared for a family member appear in your account so you can manage their care. You can remove a family member at any time; medical history already recorded for that person is retained as set out under Data Retention and may be discussed with you as their legal representative.",
  },
  {
    body: "Payments are arranged through mobile money (MTN Mobile Money, Orange Money), bank transfer, or on pickup/delivery. We do not store your card details on this website.",
  },
  {
    body: "We use a small set of cookies and local storage: essential cookies for security and sessions, a language preference cookie, and local storage to keep your shopping cart and delivery preferences. We do not use intrusive advertising trackers. See our Cookie Policy for the full list and how to control them.",
  },
  {
    body: `Your data is hosted on secure cloud infrastructure. MongoDB Atlas stores account and health records, Cloudinary stores uploaded images (including ID documents and record attachments), and our email and messaging providers deliver notifications. Some of these providers may process data outside Cameroon; where this happens we rely on appropriate safeguards and on your understanding that data may be stored in countries with differing data-protection regimes.`,
  },
  {
    body: "With your consent we may send health tips, product updates and clinic news by email or WhatsApp. Every marketing message includes a way to unsubscribe, and you can opt out at any time by contacting us. Operational messages (orders, appointments, medical updates) are not marketing and will still be sent.",
  },
  {
    body: `You may request a copy of the personal data we hold about you, ask for corrections, remove identification documents or family members, close your account, and request that your account and records be deleted as permitted by law. Email us at ${CLINIC.email} to make a request. We will respond within a reasonable time and may need to verify your identity.`,
  },
  {
    body: "Because ongoing care may require a history of consultations, records, prescriptions and orders, that data is kept for as long as reasonably necessary to provide care and meet legal obligations, and is securely deleted after that period. Account-only data (for example profile fields you clear, removed ID documents or removed family members) is deleted or anonymised promptly.",
  },
  {
    body: "If you believe your data has been handled incorrectly, contact us first at {emailBig} and we will do our best to resolve it, including how to report a concern to a competent data-protection or consumer authority in Cameroon.",
  },
];

export default async function PrivacyPage() {
  const t = await serverT();
  const sectionsRendered = sections.map((s, i) => ({
    ...s,
    body:
      i === sections.length - 1
        ? s.body.replace("{emailBig}", CLINIC.email)
        : s.body,
  }));
  return (
    <>
      <PageHero eyebrow={t("legal.eyebrow")} title={t("privacy.metaTitle")} lead={t("privacy.lead")} compact image={S19_ASSETS.photos.patientRecords} />
      <Container className="max-w-3xl py-10 md:py-14">
        <p className="text-sm text-muted">
          {t("privacy.intro", { brand: CLINIC.brand, slogan: CLINIC.slogan })}
        </p>
        <div className="mt-8 space-y-6">
          {sectionsRendered.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold">{t(sectionKeys[i])}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-line bg-mist p-5 text-sm text-muted">
          <p>
            {t("privacy.questions", { email: CLINIC.email, phone: CLINIC.phone })}{" "}
            <Link href="/cookies" className="font-semibold text-forest-700 hover:text-forest-800">
              {t("cookies.metaTitle")}
            </Link>
          </p>
        </div>
      </Container>
    </>
  );
}