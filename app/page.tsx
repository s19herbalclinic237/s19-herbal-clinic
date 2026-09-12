import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { BookingForm } from "@/components/sections/booking-form";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { getFeaturedProducts } from "@/lib/catalog";
import {
  treatmentPrograms,
  clinicalPrinciples,
  telehealthSteps,
  faqs,
} from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { testimonials } from "@/lib/data/testimonials";

export const revalidate = 60;
import {
  FaWhatsapp,
  FaGlobe,
  FaMapLocationDot,
  FaClock,
  FaArrowRight,
  FaChevronDown,
  FaStar,
  FaRegCircleCheck,
} from "react-icons/fa6";

const STORY_IMG = S19_ASSETS.photos.nutritionBasket;

const focus = [
  {
    icon: S19_ASSETS.icons.herbalMedicine,
    title: "Clinical Care",
    desc: "In-clinic health assessments and individualized herbal treatment plans reviewed around your medical history and lab results.",
    href: "/programs",
    label: "Clinical Programs",
  },
  {
    icon: S19_ASSETS.icons.trustedCare,
    title: "Tele-Health",
    desc: "Structured remote consultations, lab result review, and scheduled follow-ups - anywhere in the world via phone and WhatsApp.",
    href: "/telehealth",
    label: "Book Virtual Visit",
  },
  {
    icon: S19_ASSETS.icons.naturalIngredients,
    title: "Herbal Catalog",
    desc: "Standardized herbal teas, extracts, and detox packs. Available for pickup in Bafoussam and worldwide delivery.",
    href: "/shop",
    label: "Browse Catalog",
  },
];

const bookingSteps = [
  { n: "01", title: "Assess", text: "Book an assessment - in clinic or remotely." },
  { n: "02", title: "Protocol", text: "We tailor a root-cause herbal protocol." },
  { n: "03", title: "Dispatch", text: "Your pack is shipped to your door." },
  { n: "04", title: "Follow-up", text: "Scheduled check-ins on your progress." },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[86vh] items-center overflow-hidden bg-forest-950">
        <img
          src={S19_ASSETS.photos.shopCounter}
          alt="The S19 Herbal Clinic reception and product counter in Bafoussam"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent" />

<Container className="relative z-10 w-full py-24 md:py-32">
          <Reveal>
            <h1 className="mt-6 max-w-3xl text-balance text-white drop-shadow-sm">
              Natural healing,
              <span className="block text-gold-400">lasting wellness.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-forest-100/90 md:text-lg">
              Welcome to {CLINIC.brand} in Bafoussam. Our mission is to provide safe, natural and
              effective herbal solutions that support long-term health and wellbeing -
              science-based assessment, individualized formulations, and Tele-Health, one clinic
              with a worldwide reach.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/contact" className={buttonLinkClasses("gold", "xl")}>
                Book Health Assessment
                <FaArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={waLink("Hello S19 Herbal Clinic, I would like to inquire about a consultation or treatment.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("glass", "xl")}
              >
                <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                WhatsApp the Clinic
              </a>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* CORE FOCUS */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>What we offer</Kicker>
            <h2 className="mt-4">Three ways to care.</h2>
            <p className="mt-4 text-[15px] text-muted">
              One clinic, a worldwide reach - in-clinic care, remote Tele-Health, and a
              standardized herbal catalog delivered to your door.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {focus.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <Link
                href={f.href}
                className="group relative block h-full overflow-hidden rounded-lg border border-line bg-cream p-8 transition-all hover:border-forest-300 hover:shadow-lift"
              >
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-forest-100/70 blur-2xl transition-transform duration-700 group-hover:scale-125" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 shadow-lift transition-transform group-hover:scale-110">
                    <img src={f.icon} alt="" className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-ink">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{f.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-forest-800 transition-all group-hover:gap-3">
                    {f.label}
                    <FaArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* TREATMENT PROGRAMS */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <Reveal>
              <Kicker>Clinical care focus</Kicker>
              <h2 className="mt-4">Integrative Treatment Programs.</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                Every plan is customized after your individual assessment. Pricing is confirmed per
                patient after your evaluation.
              </p>
              <Link href="/programs" className={buttonLinkClasses("primary", "lg", "mt-8")}>
                View all programs
                <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            {treatmentPrograms.slice(0, 6).map((p, i) => (
              <div key={p.slug} className="group border-b border-line">
                <Link href={`/programs#${p.slug}`} className="flex items-start gap-5 py-6 transition-colors">
                  <span className="font-display text-3xl font-semibold text-forest-200 transition-colors group-hover:text-gold-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink transition-colors group-hover:text-forest-800">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.short}</p>
                  </div>
                  <FaArrowRight className="mt-2 h-4 w-4 shrink-0 text-forest-400 transition-transform group-hover:translate-x-1 group-hover:text-forest-700" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PRINCIPLES - editorial split */}
      <Section className="bg-white">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-lg shadow-lift">
              <img src={STORY_IMG} alt="The S19 Herbal Clinic care environment" className="h-[420px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 to-transparent" />
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal>
              <Kicker>Why S19</Kicker>
              <h2 className="mt-4">Built on review, reason, and follow-through.</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                {CLINIC.brand} is a Bafoussam-based herbal and integrative wellness clinic. Our
                clinical philosophy starts with the individual - their history, their labs, their
                daily reality - before any remedy is prescribed.
              </p>
              <div className="mt-8 space-y-5">
                {clinicalPrinciples.map((p) => (
                  <div key={p.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-800">
                      <FaRegCircleCheck className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-ink">{p.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* FEATURED REMEDIES */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Kicker>Standardized formulas</Kicker>
            <h2 className="mt-3">S19 Herbal Catalog</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">
              Carefully formulated botanical solutions, available for pickup in Bafoussam and
              worldwide delivery.
            </p>
          </Reveal>
          <Link href="/shop" className={buttonLinkClasses("primary", "md")}>
            View full catalog
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Also available in clinic: S19 Malaria &amp; Typhoid Tea, Activated Charcoal, Toothpaste
          Powder, Castor Oil, Weight-loss Tea, and Herbal Wine.
        </p>
      </Section>

      {/* TELEHEALTH - full-bleed image band */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <img
          src={S19_ASSETS.photos.patientRecords}
          alt="S19 staff recording patient health records at the clinic office"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/40" />
        <Container className="relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <Kicker dark>Virtual care</Kicker>
                <h2 className="mt-5 text-balance text-white">
                  Remote consultations &amp; follow-ups, anywhere.
                </h2>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-forest-100/90">
                  Cannot make it to Bafoussam? We run structured online assessments - symptoms,
                  medical history, and lab reports - then dispatch your protocol and stay with you
                  through scheduled follow-ups.
                </p>
                <a
                  href={waLink("Hello S19 Herbal Clinic, I would like to book a Tele-health online consultation.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonLinkClasses("gold", "xl", "mt-8")}
                >
                  <FaGlobe className="h-4 w-4" aria-hidden />
                  Book Virtual Consult
                </a>
              </Reveal>
            </div>
            <div className="space-y-0 lg:col-span-6">
              {telehealthSteps.map((t, i) => (
                <Reveal key={t.step} delay={i * 0.08}>
                  <div className="flex items-start gap-5 border-b border-white/15 py-6 first:pt-0 last:border-0">
                    <span className="font-display text-4xl font-semibold text-gold-400">{t.step}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-forest-100/85">{t.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* HOW BOOKING WORKS */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 shadow-sm">
              <img src={S19_ASSETS.icons.wellnessAndCare} alt="" className="h-6 w-6" aria-hidden />
            </div>
            <Kicker center>Getting care</Kicker>
            <h2 className="mt-4">Four steps, start to follow-up.</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-cream sm:grid-cols-2 lg:grid-cols-4">
          {bookingSteps.map((s) => (
            <div key={s.n} className="relative bg-white p-7">
              <span className="font-display text-4xl font-semibold text-forest-200">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>Patient stories</Kicker>
            <h2 className="mt-4">Care that people talk about.</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.slice(0, 6).map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-lg border border-line bg-white p-7 shadow-card transition-shadow hover:shadow-lift">
                <div className="flex items-center gap-1 text-gold-500">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <FaStar key={j} className="h-3.5 w-3.5" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/80">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                  <span className="font-bold text-ink">{t.name}</span>
                  <span className="mx-1.5 text-muted">·</span>
                  <span className="text-muted">{t.city}</span>
                  {t.country ? (
                    <>
                      <span className="mx-1.5 text-muted">·</span>
                      <span className="text-forest-600">{t.country}</span>
                    </>
                  ) : null}
                  <span className="mt-1 block text-xs font-medium italic text-muted">{t.program}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* BOOKING */}
      <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <Container className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <Kicker dark>Direct consultation</Kicker>
                <h2 className="mt-4 text-white">Book your health assessment.</h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-forest-200">
                  Fill the form to request a priority in-clinic appointment or a Tele-Health
                  consultation. Our clinical team confirms your assessment by phone or WhatsApp.
                </p>
                <ul className="mt-8 space-y-4 text-sm text-forest-200">
                  <li className="flex items-start gap-3">
                    <FaWhatsapp className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>Prefer WhatsApp? Chat directly at {CLINIC.phone}.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaClock className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{CLINIC.hours} · In-clinic, or book a remote Tele-Health visit.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaMapLocationDot className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{CLINIC.address}.</span>
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div className="rounded-lg border border-forest-800 bg-white p-6 shadow-lift md:p-9">
                <BookingForm />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* LOCATION - full-bleed image band */}
      <section className="relative overflow-hidden py-24 md:py-28">
        <img
          src={S19_ASSETS.photos.bloodPressure}
          alt="S19 staff measuring a patient's blood pressure in the Bafoussam clinic"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/35" />
        <Container className="relative z-10">
          <Reveal>
            <Kicker dark>Find the clinic</Kicker>
            <h2 className="mt-4 max-w-xl text-balance text-white">Care across Cameroon and the world.</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <FaMapLocationDot className="h-5 w-5 text-gold-400" aria-hidden />,
                title: "Bafoussam Clinic",
                lines: ["Immeuble Cathédrale, 3rd Floor", "Apartment E305, Bafoussam"],
              },
              {
                icon: <FaClock className="h-5 w-5 text-gold-400" aria-hidden />,
                title: "Opening Hours",
                lines: ["Monday – Saturday: 8:00 AM – 6:00 PM", "Tele-Health follow-ups: scheduled"],
              },
              {
                icon: <FaGlobe className="h-5 w-5 text-gold-400" aria-hidden />,
                title: "Delivery Coverage",
                lines: ["Cameroon: Douala, Yaoundé, Bamenda, Buea", "International: worldwide express"],
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="h-full rounded-lg border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 bg-white/10">
                    {c.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{c.title}</h3>
                  {c.lines.map((l) => (
                    <p key={l} className="mt-1 text-sm leading-relaxed text-forest-100/85">
                      {l}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <Link href="/location" className={buttonLinkClasses("secondary", "lg", "mt-10")}>
              Visit our location page
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <Kicker>Common questions</Kicker>
            <h2 className="mt-4">Frequently asked questions.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Straight answers about consultations, delivery, payments, and how S19 remedies work.
            </p>
          </Reveal>
          <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-card">
            {faqs.map((f) => (
              <details key={f.question} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-ink transition-colors hover:text-forest-800">
                  {f.question}
                  <FaChevronDown className="h-3.5 w-3.5 shrink-0 text-forest-500 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <CTABand />
    </>
  );
}