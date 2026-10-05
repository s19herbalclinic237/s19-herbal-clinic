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
  "terms.section.noGuarantee",
  "terms.section.telemedicine",
  "terms.section.appointments",
  "terms.section.records",
  "terms.section.orders",
  "terms.section.shipping",
  "terms.section.returns",
  "terms.section.family",
  "terms.section.messages",
  "terms.section.ids",
  "terms.section.liability",
  "terms.section.governingLaw",
  "terms.section.changes",
] as const;

const sections = [
  {
    title: "General",
    body: `By accessing ${CLINIC.brand} website you agree to these terms. The content on this site is provided for informational purposes and is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical emergency, contact local emergency services immediately.`,
  },
  {
    title: "Health Disclaimer",
    body: "S19 herbal products and programs support wellness and complement, but never replace, conventional medical care. Always consult a qualified health professional about your condition and before starting any new remedy, especially if you are pregnant, nursing, on medication, or under oncology care.",
  },
  {
    title: "No Guaranteed Results",
    body: `The clinic does not and cannot guarantee any particular health outcome, cure, or result from any product, consultation, program, or treatment. Individual results vary depending on the person, the condition, and how consistently the guidance is followed. Statements on this site are informational and are not medical claims approved by a regulatory authority.`,
  },
  {
    title: "Online Consultations (Telemedicine)",
    body: `Online consultations and follow-up may be provided by phone, WhatsApp or secure video, depending on what is clinically appropriate and agreed with you. Remote care is for follow-up, education and care coordination. Online consultations (tele-health) are not an emergency service and are not suitable for life-threatening conditions; in an emergency, please contact local emergency services or go to the nearest hospital immediately. The clinic may refuse, postpone or end a remote consultation if it is technically unsuitable or if remote care is not clinically appropriate, and in such cases you may be advised to attend in person. Video sessions are not recorded. By joining a session, you confirm that you are in a private, secure and suitable location.`,
  },
  {
    title: "Appointments & Reminders",
    body: "Appointments are subject to availability and are booked on a first-come, first-served basis. Confirmations and reminders are delivered to your account messages, and by WhatsApp only if you choose to enable it. You can reschedule or cancel from your dashboard up to the scheduled time; cancelled or rescheduled slots become available to other patients. Repeated no-shows may affect future booking preferences, and the clinic may ask you to confirm attendance before close to the appointment time.",
  },
  {
    title: "Medical Records & Prescriptions",
    body: "Medical records and prescriptions are created and maintained by your care team for your information, follow-up and continuity of care. They support, but do not replace, professional medical advice and should be discussed with your provider. You should follow dosage and usage instructions exactly and contact the clinic before changing or stopping any treatment. Records and prescriptions may be downloaded for personal use and shared with other providers at your discretion. Herbal products referenced in prescriptions may be ordered through the clinic or the shop. Where applicable, copies of prescriptions may be provided in line with your care plan.",
  },
  {
    title: "Orders & Payment",
    body: "Orders are confirmed by our clinic before dispatch. Payment is accepted by mobile money, bank transfer, or on pickup/delivery. Prices are displayed in FCFA and may change without notice. Delivery fees depend on destination and are confirmed with each order.",
  },
  {
    title: "Shipping & Delivery",
    // Item 09 of the footer/navigation guide. The old sentence said S19 dispatches
    // "worldwide via express courier", promising a service to every country and a
    // courier S19 does not name. The replacement states the destination-dependent
    // terms the guide requires.
    body: "We dispatch nationwide across Cameroon and to supported international destinations. Local pickup is available at our Bafoussam clinic during opening hours. International shipping availability, delivery charges and estimated delivery times depend on the destination and are confirmed with each order. Our team may provide delivery updates through the communication details supplied with your order.",
  },
  {
    title: "Returns & Refunds",
    body: "Refunds, returns and exchanges are handled in accordance with our Refund, Return & Exchange Policy. Damaged, defective or incorrectly supplied products must be reported within 48 hours of receipt, with supporting evidence (such as photos and your order details). For hygiene and safety reasons, opened, used or consumed products are generally not eligible for a voluntary return or refund. Certain items, including personalized, compounded or custom preparations, are final sale once preparation has commenced or, where applicable, once opened. Return eligibility, time limits and any shipping costs depend on the specific circumstances and are assessed in line with that policy.",
  },
  {
    title: "Family Accounts & Children",
    body: `The account holder may add family members (children, a spouse, parents or siblings) to their account and may book appointments, and receive records and prescriptions, for those members. By adding a member you confirm you have the authority to do so, including for any child, and you accept responsibility for the accuracy of the information. Family members do not receive separate logins: their records and prescriptions appear inside your account and are managed by you. You may remove a family member from your account at any time, which stops future visits tagged to them but does not delete medical history already recorded for that person.`,
  },
  {
    title: "Messaging & Communication",
    body: `Messages sent through your account form a private conversation thread with the clinic and are used for updates, reports and follow-up. Replies are monitored during clinic hours and are not an emergency channel. Never include emergency requests in messages; if you feel unwell, contact the clinic by phone or emergency services. For your safety, keep medical conversations in your account rather than by SMS or unsecured email.`,
  },
  {
    title: "ID Document Verification",
    body: "For your safety and to confirm identity, we may ask you to upload the front and back of a national ID, passport or birth certificate. Only upload identification documents and avoid documents or pages that contain unrelated sensitive information. Your documents are stored securely, are visible only to authorised clinic staff, and you can remove them from your account at any time.",
  },
  {
    title: "Liability",
    body: "Use of this website and its products is at your own risk. To the extent permitted by law, the clinic is not liable for indirect or consequential losses arising from use of the site or products. Nothing in these terms limits liability that cannot lawfully be limited.",
  },
  {
    title: "Governing Law & Disputes",
    body: `These terms are governed by the laws of the Republic of Cameroon, including Law No. 2010/012 of 21 December 2010 relating to cyber security and cyber criminality and Law No. 2024/017 of 23 December 2024 relating to the protection of personal data. In the event of a dispute, we will first try to resolve it amicably through our clinic team. If it cannot be resolved amicably, any claim shall be subject to the jurisdiction of the competent courts of Cameroon.`,
  },
  {
    title: "Changes to These Terms",
    body: "We may update these Terms of Use from time to time to reflect new features, legal requirements or operational changes. The current version, with its last-updated date, is always available on this page. Your continued use of the website after any changes become effective constitutes your acceptance of the updated terms.",
  },
];

export default async function TermsPage() {
  const t = await serverT();
  return (
    <>
      <PageHero eyebrow={t("legal.eyebrow")} title={t("terms.metaTitle")} lead={t("terms.lead")} compact image={S19_ASSETS.photos.labBeakers} alt={t("terms.hero.alt")} />
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