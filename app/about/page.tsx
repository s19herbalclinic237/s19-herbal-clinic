import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { CTABand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { clinicalPrinciples } from "@/lib/data/programs";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaRegCircleCheck, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";

const HERO_IMG = S19_ASSETS.photos.labBeakers;
const STORY_IMG = S19_ASSETS.photos.labTransfer;

const pillars = [
  {
    title: "Science-Based Assessment",
    text: "Every protocol begins with your medical history, previous treatments, lab workups, and diagnostic scans. We never prescribe blind.",
    icon: S19_ASSETS.icons.trustedCare,
  },
  {
    title: "Individualized Herbal Formulation",
    text: "Remedies are standardized for safety and quality, but the combination, dosage, and program are tailored to your exact condition.",
    icon: S19_ASSETS.icons.herbalMedicine,
  },
  {
    title: "Nutrition & Lifestyle Medicine",
    text: "Botanicals work best when diet and daily habits support them. Coaching runs alongside every treatment plan.",
    icon: S19_ASSETS.icons.naturalIngredients,
  },
];

const steps = [
  "Send your health details via the assessment form or WhatsApp.",
  "Our team reviews your history, symptoms, and any lab results.",
  "You receive a personalized herbal protocol and usage schedule.",
  "We follow up regularly to adjust dosage and track progress.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Approach"
        title="Understanding the root factors of illness — not masking symptoms."
        lead={`${CLINIC.brand} is a Bafoussam-based herbal and integrative wellness clinic focused on science-based herbalism, individualized health assessments, nutrition, and lifestyle medicine.`}
        image={HERO_IMG}
        alt="Fresh botanical herbs used at S19 Herbal Clinic"
      />

      {/* Story split */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>Clinical philosophy</Kicker>
            <h2 className="mt-4">Root-cause care, one patient at a time.</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              Our clinical philosophy centers on thoroughly understanding the biological,
              lifestyle, and physiological factors contributing to each patient&apos;s condition —
              rather than prescribing generic cures blindly.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              That means real listening, real review of your lab results, and a plan that changes
              as you change. It is slower at the start, and far more effective in the long run.
            </p>
            <Link href="/programs" className={buttonLinkClasses("primary", "lg", "mt-8")}>
              Explore treatment programs
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div
              className="relative overflow-hidden rounded-lg"
              style={{
                boxShadow:
                  "12px 12px 0 0 rgba(23, 78, 62, 0.28), 26px 26px 0 0 rgba(26, 98, 76, 0.18), 42px 42px 0 0 rgba(8, 36, 29, 0.1)",
              }}
            >
              <img src={STORY_IMG} alt="Science-based assessment at S19 Herbal Clinic" className="h-[440px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 to-transparent" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Pillars */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>How we work</Kicker>
            <h2 className="mt-4">Three pillars of every protocol.</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="group h-full rounded-lg border border-line bg-cream p-8 transition-all hover:border-forest-300 hover:shadow-lift">
<div className="flex h-14 w-14 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 shadow-lift transition-transform group-hover:scale-110">
                    <img src={p.icon} alt="" className="h-7 w-7" aria-hidden />
                  </div>
                <h3 className="mt-6 text-xl font-bold text-ink">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Steps + principles */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>How it works</Kicker>
            <h2 className="mt-4">Four steps to your personalized protocol.</h2>
            <ol className="mt-8">
              {steps.map((s, i) => (
                <li key={s} className="flex items-start gap-5 border-b border-line py-5 first:pt-0 last:border-0">
                  <span className="font-display text-3xl font-semibold text-forest-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1.5 text-[15px] leading-relaxed text-ink/80">{s}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-lg border border-line bg-white p-7 shadow-card md:p-9">
              <Kicker>Two integrating principles</Kicker>
              <h3 className="mt-3 text-xl font-bold text-ink">The commitments behind every plan</h3>
              <div className="mt-7 space-y-6">
                {clinicalPrinciples.map((p) => (
                  <div key={p.title} className="border-l-2 border-forest-600 pl-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <FaRegCircleCheck className="h-4 w-4 text-forest-700" aria-hidden />
                      {p.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <CTABand title="Ready for a root-cause approach to your health?" text="Book an in-clinic assessment at our Bafoussam headquarters or a remote Tele-health consultation." />
    </>
  );
}