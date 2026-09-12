import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaWhatsapp } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Refund, Return & Exchange Policy",
  description:
    "How S19 Herbal Clinic handles refunds, returns, and exchanges for herbal products and consultations.",
};

const sections = [
  {
    title: "1. Returns & Eligibility",
    body: "Where a return is permitted, the product must normally be unused, unopened, unaltered, in its original condition and packaging, and accompanied by valid proof of purchase. S19 reserves the right to verify eligibility before approving any request. Mandatory consumer rights remain unaffected.",
  },
  {
    title: "2. Damaged, Defective or Incorrect Products",
    body: "If S19 supplies a product that is defective, incorrectly supplied, incorrectly labeled, or was damaged before being handed over for transportation, the customer should contact S19 preferably within 48 hours of receiving the order. S19 may require the order number or receipt, product details, photographs or video, and other information reasonably required to verify the claim. After verification, S19 may provide an appropriate replacement, exchange or refund, subject to applicable law.",
  },
  {
    title: "3. Opened, Used & Health Products",
    body: "Because S19 products are intended for personal health use, opened, used, consumed, altered or improperly stored products are generally not eligible for voluntary return, exchange or refund, except where applicable law provides otherwise. Products damaged or improperly handled after delivery are also excluded from S19's voluntary refund program.",
  },
  {
    title: "4. Personalized & Custom Preparations",
    body: "Products specially formulated, compounded, prepared or packaged according to an individual customer's requirements are generally final sale once preparation has commenced, except where S19 made an error or applicable law requires otherwise.",
  },
  {
    title: "5. Consultations, Treatments & Programs",
    body: "Consultations, assessments, therapy sessions and other professional services already provided are generally non-refundable. Where a package contains multiple products or services, any eligible refund will be assessed based on the unused and otherwise refundable portion. Products already prepared, supplied, opened or consumed and services already performed may be deducted from any eligible refund, subject to applicable law.",
  },
  {
    title: "6. Health Results",
    body: "Individual responses to herbal products, nutrition, lifestyle interventions and wellness programs vary. S19 does not guarantee a particular health outcome. Failure to obtain an expected health result, by itself, does not automatically qualify a customer for a refund, return or exchange. This does not affect rights concerning genuinely defective, incorrectly supplied or non-conforming products or services.",
  },
  {
    title: "7. Shipping, Courier & Transport Agencies",
    body: "S19 carefully prepares customer orders before releasing them for transportation. Independent providers may include DHL, UPS, Musango, Avenir, General Express and other third-party carriers. To the extent permitted by law, S19 does not bear responsibility for errors or incidents caused solely by an independent shipping or transport provider after the parcel has been properly handed over, including carrier-caused delays, loss, misplacement, theft, mishandling, transportation damage or delivery errors. S19 may reasonably assist with available shipment information, but such assistance does not constitute acceptance of liability. Customers are responsible for providing complete and accurate delivery information.",
  },
  {
    title: "8. Exchanges",
    body: "Eligible exchanges are subject to S19 verification and approval. Any applicable price difference must be settled before a replacement product is released.",
  },
  {
    title: "9. Return & Delivery Costs",
    body: "Customers must contact S19 before returning any product. Sending a product back without authorization does not automatically create a right to a refund. For voluntary returns, the customer may be responsible for return transportation and related costs where permitted by law. Original shipping or delivery charges may be non-refundable where legally permitted. Where an eligible claim results directly from an error attributable to S19, S19 will provide the appropriate remedy in accordance with this policy and applicable law.",
  },
  {
    title: "10. Refund Processing",
    body: "Approved refunds will normally be made through the original payment method or another method agreed by S19 and the customer. Any refund is ordinarily limited to the amount actually paid for the eligible product or service, unless applicable law requires otherwise. Complimentary, promotional or free products have no independent refundable cash value. Processing times may vary depending on banks, Mobile Money operators or payment providers.",
  },
  {
    title: "11. Verification & Inspection",
    body: "S19 may, where legally permitted, inspect returned products and request reasonable supporting information before approving a refund or exchange. S19 reserves the right to reject fraudulent, duplicate, falsified or abusive claims, deliberate customer-caused damage, or requests that do not satisfy the conditions of this policy, to the extent permitted by law.",
  },
  {
    title: "12. How to Submit a Request",
    body: "Contact S19 Customer Service with your full name, telephone number, order number or receipt, product name, date of purchase or delivery, reason for request, and photographs or video where relevant. Please do not return products until S19 provides return instructions.",
  },
  {
    title: "13. Consumer Rights",
    body: "This policy is intended to operate in accordance with applicable laws of the Republic of Cameroon. Nothing in this policy excludes, restricts or overrides any consumer right or legal responsibility that cannot lawfully be excluded or restricted.",
  },
];

export default function RefundReturnsPage() {
  return (
    <>
      <PageHero
        eyebrow="Policy"
        title="Refund, Return & Exchange Policy"
        lead="How S19 Herbal Clinic handles refunds, returns, and exchanges for herbal products and professional services."
        compact
        image={S19_ASSETS.photos.cupboardProducts}
      />
      <Container className="max-w-3xl py-10 md:py-14">
        <p className="text-sm text-muted">
          Last updated: September 2026. At {CLINIC.brand} we are committed to providing quality
          herbal products and professional services. All requests are subject to verification, this
          policy, and applicable law.
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
          <p className="font-semibold text-ink">How to reach customer service</p>
          <p className="mt-2">
            WhatsApp / Phone:{" "}
            <span className="font-semibold text-forest-700">{CLINIC.phone}</span> · Email:{" "}
            <a href={`mailto:${CLINIC.email}`} className="font-semibold text-forest-700">
              {CLINIC.email}
            </a>
          </p>
          <a
            href={waLink("Hello S19 Herbal Clinic, I have a question about a return, refund or exchange.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-forest-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-900"
          >
            <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
            Open a request on WhatsApp
          </a>
        </div>
      </Container>
    </>
  );
}