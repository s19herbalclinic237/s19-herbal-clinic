import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How S19 Herbal Clinic collects, uses, and protects your personal and health information.",
};

const sections = [
  {
    title: "Information We Collect",
    body: "When you use this website we collect the information you provide: your name, phone number, email address, delivery address, order details, and any health information you share in consultation or assessment forms. We may collect basic technical data such as pages visited to improve the site.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to respond to assessment and consultation requests, confirm and deliver orders, send appointment and order notifications by email or WhatsApp, and provide follow-up care. We never sell or rent your personal data.",
  },
  {
    title: "Health Information",
    body: "Health information you share is treated as strictly confidential. It is only visible to S19 clinic staff involved in your care and is stored securely. It is never shared with third parties without your consent, except where required by law.",
  },
  {
    title: "Payments",
    body: "Payments are arranged through mobile money (MTN Mobile Money, Orange Money), bank transfer, or on pickup/delivery. We do not store your card details on this website.",
  },
  {
    title: "Cookies & Local Storage",
    body: "We use essential local storage only - for example to keep your shopping cart and remember delivery preferences. We do not use intrusive advertising trackers.",
  },
  {
    title: "Your Rights",
    body: "You may request a copy of the personal data we hold about you, ask for corrections, or request that your account and records be closed and deleted as permitted by law. Email us at " + CLINIC.email + " to make a request.",
  },
  {
    title: "Data Retention",
    body: "Order and consultation records are kept for as long as reasonably necessary to provide ongoing care and meet legal obligations, and are securely deleted after that period.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" lead="Last updated: September 2026" compact image={S19_ASSETS.photos.patientRecords} />
      <Container className="max-w-3xl py-10 md:py-14">
        <p className="text-sm text-muted">
          {CLINIC.brand} ({CLINIC.slogan}) respects your privacy. This policy explains what we
          collect, why, and how it is protected.
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-line bg-mist p-5 text-sm text-muted">
          Questions about privacy? Contact us at{" "}
          <a href={`mailto:${CLINIC.email}`} className="font-semibold text-forest-700">{CLINIC.email}</a>{" "}
          or {CLINIC.phone}.
        </div>
      </Container>
    </>
  );
}