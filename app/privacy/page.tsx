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
  "privacy.section.legalBasis",
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
  "privacy.section.breaches",
  "privacy.section.controller",
  "privacy.section.complaints",
] as const;

const sections = [
  {
    body: "When you use this website we collect the information you provide: your name, phone number, email address, delivery address, order details, health information shared in consultation or assessment forms, messages you send us, and — only where you choose to provide them — profile data such as date of birth, gender, emergency contact and identification documents. Our servers also briefly process technical data (such as your IP address and browser type) needed to deliver pages securely; this is kept only for security and operational purposes and is not used to build profiles.",
  },
  {
    body: "Your information is used to respond to assessment and consultation requests, confirm and deliver orders, book and manage appointments, coordinate telemedicine sessions, issue and track medical records and prescriptions, send appointment and order notifications by email or WhatsApp, and provide follow-up care. We never sell or rent your personal data, and we never share it for advertising purposes.",
  },
  {
    body: `We process your data only on lawful bases: (1) to perform the service you asked for (orders, appointments, consultations, records and prescriptions); (2) with your consent where we ask for it (for example marketing messages, testimonials, or certain cookies); (3) to meet legal obligations (tax and consumer-law records, and the security obligations of Law No. 2010/012 of 21 December 2010 on cyber security in Cameroon); and (4) our legitimate interest in running and securing the clinic's services, which never overrides your rights. Where processing relies on your consent you may withdraw it at any time without affecting the legality of processing carried out before withdrawal.`,
  },
  {
    body: `In your account you may add profile information such as date of birth, gender, home address, an emergency contact, and identification documents (front and back of a national ID, passport or birth certificate). We use these to identify you safely, confirm appointments and, when present, to contact your emergency contact. Documents are stored securely, are visible only to authorised clinic staff, and you can view, replace or remove them at any time from your settings.`,
  },
  {
    body: `Health information - including medical records, visit notes, diagnoses, lab results, scans, prescriptions and appointment details - is treated as strictly confidential and benefits from the heightened protection that personal health data receives under Cameroon law (including Law No. 2024/017 of 23 December 2024 on the protection of personal data) and, where applicable, the EU GDPR. It is only visible to S19 clinic staff involved in your care and is stored securely. It is never shared with third parties without your consent, except where required by law or to protect life.`,
  },
  {
    body: "Video consultations take place over secure meeting links. Sessions are never recorded or stored, and call metadata (who, when, duration) is kept only for appointment purposes. We may ask you to confirm your identity before a session. If you join from a shared or public device, make sure you sign out of your account afterwards.",
  },
  {
    body: "When you add a family member such as a child, we process that person's basic details (name, date of birth where provided, gender, relationship) under your authority as account holder and your confirmation that you may share their information. Records and prescriptions prepared for a family member appear in your account so you can manage their care. You can remove a family member at any time; medical history already recorded for that person is retained as set out under Data Retention and may be discussed with you as their legal representative.",
  },
  {
    body: "Payments are arranged through mobile money (MTN Mobile Money, Orange Money), bank transfer, or on pickup/delivery. Mobile-money transactions happen on the provider's own platform or by payment link, and we never receive or store your card details. Provider pages have their own privacy policies.",
  },
  {
    body: `We use a small set of cookies and local storage: an essential session cookie for security and to keep you signed in ("s19_session"), a language preference cookie ("s19_locale"), and local storage to keep your shopping cart and delivery preferences in your browser. We do not place analytics, advertising or tracking cookies, and we do not run third-party trackers. See our Cookie Policy for the full list and how to control them.`,
  },
  {
    body: `Your data is hosted on secure cloud infrastructure: MongoDB Atlas stores account and health records, Cloudinary stores uploaded images (including ID documents and record attachments), and Vercel serves the application. These providers may process data outside Cameroon; for transfers we rely on the provider's data-processing safeguards and, for individuals subject to the EU GDPR, on the EU Standard Contractual Clauses or an adequacy decision. We keep transfers to the minimum needed to operate the service.`,
  },
  {
    body: `With your consent we may send health tips, product updates and clinic news by email or WhatsApp. Consent is recorded, every marketing message includes a way to unsubscribe, and you can opt out at any time by contacting us. Operational messages (orders, appointments, medical updates) are not marketing and will still be sent. Testimonials are published only with your explicit consent, and you may withdraw that consent at any time.`,
  },
  {
    body: `Under the Cameroon law on the protection of personal data (Law No. 2024/017) and, where applicable, the EU GDPR, you have the right to: access a copy of the personal data we hold about you; correct inaccurate data; erase your data (subject to legal retention duties); restrict or object to processing (including objecting to marketing at any time); data portability where processing is automated and based on consent or a contract; and withdraw consent where processing relies on it. To exercise any of these rights, email us at ${CLINIC.email}, we will verify your identity, and we will respond within the time required by law (normally within 30 days). You may also close your account or delete records from your dashboard where available.`,
  },
  {
    body: `We keep health and account data only as long as reasonably necessary to provide care and to meet legal obligations: active care records are kept while your treatment continues and for a reasonable period afterwards to support follow-up and to satisfy medical-records practice; orders, invoices and financial records are kept for the period required by commercial and tax law; ID documents are kept only while needed for verification and removed as you delete them; unverified accounts and abandoned data are purged periodically; and backup archives are deleted after their retention period. Data that no longer serves these purposes is securely deleted or anonymised.`,
  },
  {
    body: `If we ever experience a data breach that is likely to put your rights and freedoms at risk, we will notify the affected individuals without undue delay and, where required, the competent supervisory authority in Cameroon (and the relevant EU authority for individuals protected by the GDPR). We take emergency, containment and remediation measures immediately, review the incident, and strengthen safeguards to prevent recurrence. The clinic's staff are instructed to report suspected incidents internally without delay.`,
  },
  {
    body: `S19 Herbal Clinic (Bafoussam, Cameroon) is the data controller for the personal data processed through this website. Questions about privacy, processing or your rights can be sent to ${CLINIC.email} or ${CLINIC.phone}.`,
  },
  {
    body: "If you believe your data has been handled incorrectly, contact us first at {emailBig} and we will do our best to resolve it. You also have the right to lodge a complaint with the competent data-protection supervision authority in Cameroon (as established under Law No. 2024/017 of 23 December 2024) and, where the GDPR applies to you, with your local EU data-protection authority. Nothing on this page limits your rights under mandatory consumer or data-protection law.",
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