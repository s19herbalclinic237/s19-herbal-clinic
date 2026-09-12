import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { treatmentPrograms } from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaWhatsapp, FaRegCircleCheck, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";

const HERO_IMG = S19_ASSETS.photos.consultationAdvice;

export default function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow="Clinical Care Focus"
        title="Integrative Treatment Programs"
        lead="Each treatment plan is customized according to individual patient evaluation. Pricing is confirmed after your consultation and personalized treatment plan cost."
        image={HERO_IMG}
        alt="Healthy green leaves representing herbal treatment programs"
      />

      <Section>
        <Reveal>
          <div className="max-w-2xl">
            <Kicker>Programs</Kicker>
            <h2 className="mt-3">Choose the program closest to your situation.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Start with a consultation and we will build the right protocol around you.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {treatmentPrograms.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 0.06}>
              <article
                id={p.slug}
                className="group flex h-full scroll-mt-28 flex-col rounded-lg border border-line bg-white p-7 shadow-card transition-all hover:border-forest-300 hover:shadow-lift md:p-9"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-forest-600 to-forest-900 font-display text-lg font-bold text-white shadow-lift transition-transform group-hover:scale-110">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-md border border-forest-200 bg-forest-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-forest-800">
                    Program
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.short}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{p.detail}</p>

                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700">
                    Supports
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.conditions.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-1.5 rounded-md border border-line bg-cream px-2.5 py-1.5 text-xs font-medium text-ink/80"
                      >
                        <FaRegCircleCheck className="h-3 w-3 text-forest-600" aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                  <a
                    href={waLink(`Hello S19, I'm inquiring about ${p.title} support.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-900"
                  >
                    <FaWhatsapp className="h-3.5 w-3.5" aria-hidden />
                    Inquire via WhatsApp
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-forest-800 transition-colors hover:text-forest-900"
                  >
                    Book a consultation
                    <FaArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="relative mt-12 overflow-hidden rounded-lg bg-forest-950 p-8 md:p-10">
            <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Not sure where to start?</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-forest-200">
                  Book a general consultation and we will recommend the right program for you.
                  {CLINIC.brand} · {CLINIC.phone}
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-lg bg-gold-500 px-5 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-400"
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* THERAPIES WE PERFORM */}
      <section className="relative overflow-hidden py-24 md:py-28">
        <img
          src={S19_ASSETS.photos.electrolysis}
          alt="S19 therapist performing an in-clinic wellness therapy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/45" />
        <Container className="relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <Kicker dark>Supportive therapies</Kicker>
                <h2 className="mt-5 text-balance text-white">Therapies We Perform</h2>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-forest-100/90">
                  Beyond herbal medicine, S19 offers supportive and alternative therapies inspired
                  by traditional healing practices and complemented by modern scientific wellness
                  devices and instruments - including in-clinic electrolysis and therapy sessions -
                  with the aim of supporting patient well-being and improving overall care
                  outcomes.
                </p>
                <Link href="/contact" className={buttonLinkClasses("gold", "xl", "mt-8")}>
                  Book a Consultation
                  <FaArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Reveal>
            </div>
            <div className="hidden lg:col-span-6 lg:block">
              <Reveal delay={0.1}>
                <div className="flex h-full flex-col gap-5 rounded-lg border border-white/20 bg-forest-950/60 p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white">How sessions support your program</h3>
                  <ul className="space-y-4 text-sm leading-relaxed text-forest-100/85">
                    {[
                      "Relaxation sessions complementing your herbal and nutrition protocol.",
                      "Supportive care alongside medical assessment and conventional treatment.",
                      "Lifestyle and wellness coaching to reinforce long-term habits.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <FaRegCircleCheck className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <CTABand title="Talk to the clinic about your condition" text="Describe your symptoms and our clinical team will guide you to the right program." />
    </>
  );
}