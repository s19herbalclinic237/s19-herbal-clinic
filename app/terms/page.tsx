import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return { title: t("terms.metaTitle") };
}

const sectionKeys = [
  "terms.section.general",
  "terms.section.healthDisclaimer",
  "terms.section.orders",
  "terms.section.shipping",
  "terms.section.returns",
  "terms.section.liability",
] as const;

const sections = [
  {
    title: "General",
    body: `By accessing ${CLINIC.brand} website you agree to these terms. The content on this site is provided for informational purposes and is not a substitute for professional medical advice, diagnosis, or treatment.`,
  },
  {
    title: "Health Disclaimer",
    body: "S19 herbal products and programs support wellness and complement, but never replace, conventional medical care. Always consult a qualified health professional about your condition and before starting any new remedy, especially if you are pregnant, nursing, on medication, or under oncology care.",
  },
  {
    title: "Orders & Payment",
    body: "Orders are confirmed by our clinic before dispatch. Payment is accepted by mobile money, bank transfer, or on pickup/delivery. Prices are displayed in FCFA and may change without notice. Delivery fees depend on destination and are confirmed with each order.",
  },
  {
    title: "Shipping & Delivery",
    body: "We dispatch nationwide in Cameroon and worldwide via express courier. Local pickup is available at our Bafoussam clinic during opening hours. Delivery times vary by destination; our team keeps you updated by WhatsApp and SMS.",
  },
  {
    title: "Returns & Refunds",
    body: "Refunds, returns and exchanges are handled according to our Refund, Return & Exchange Policy. Damaged, defective or incorrectly supplied products should be reported within 48 hours of receipt. Because S19 products are intended for personal health use, opened, used or consumed items are generally not eligible for voluntary return or refund. Personalized and custom preparations are generally final sale once preparation has commenced.",
  },
  {
    title: "Liability",
    body: "Use of this website and its products is at your own risk. To the extent permitted by law, the clinic is not liable for indirect or consequential losses arising from use of the site or products.",
  },
];

export default async function TermsPage() {
  const t = await serverT();
  return (
    <>
      <PageHero eyebrow={t("legal.eyebrow")} title={t("terms.metaTitle")} lead={t("terms.lead")} compact image={S19_ASSETS.photos.labBeakers} />
      <Container className="max-w-3xl py-10 md:py-14">
        <div className="space-y-6">
          {sections.map((s, i) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold">{t(sectionKeys[i])}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-line bg-mist p-5 text-sm text-muted">
          {t("terms.contact", { email: CLINIC.email, phone: CLINIC.phone })}
        </div>
        <p className="mt-6 text-sm text-muted">
          {t("terms.readRefundBefore")}{" "}
          <Link href="/refund-and-returns" className="font-semibold text-forest-700 hover:text-forest-800">
            {t("terms.refundPolicy")}
          </Link>{" "}
          {t("terms.readRefundAfter")}
        </p>
      </Container>
    </>
  );
}