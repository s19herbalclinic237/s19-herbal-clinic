import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { telehealthSteps } from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaWhatsapp, FaShieldHalved, FaFlask, FaClock, FaPaperPlane } from "react-icons/fa6";

const HERO_IMG = S19_ASSETS.photos.patientRecords;

const modalities = [
  {
    title: "Online Consultation",
    text: "A structured call or WhatsApp session covering your symptoms, medical history, and lab results.",
    icon: <FaPaperPlane className="h-5 w-5 text-white" aria-hidden />,
    tile: "from-forest-600 to-forest-900",
  },
  {
    title: "Lab & Document Review",
    text: "Send us your lab reports and previous treatment records for a detailed herbal strategy review.",
    icon: <FaFlask className="h-5 w-5 text-white" aria-hidden />,
    tile: "from-gold-500 to-gold-600",
  },
  {
    title: "Scheduled Follow-Ups",
    text: "Regular check-ins on symptom progression, lifestyle adjustment, and dosage.",
    icon: <FaClock className="h-5 w-5 text-white" aria-hidden />,
    tile: "from-forest-500 to-forest-800",
  },
  {
    title: "Private & Confidential",
    text: "Your health details are kept strictly private and only shared with authorized clinic staff.",
    icon: <FaShieldHalved className="h-5 w-5 text-white" aria-hidden />,
    tile: "from-forest-700 to-forest-950",
  },
];

export default function TelehealthPage() {
  return (
    <>
      <PageHero
        eyebrow="Virtual Medical Care Available"
        title="S19 Tele-Health: remote consultations & follow-ups anywhere."
        lead="Cannot make it to our physical clinic in Bafoussam? We provide structured online consultations, evaluation of your laboratory results, and scheduled treatment follow-ups via phone and secure messaging."
        image={HERO_IMG}
        alt="Doctor preparing for a remote Tele-Health consultation"
      />

      {/* Steps */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>How remote care works</Kicker>
            <h2 className="mt-4">From assessment to follow-up, wherever you are.</h2>
          </div>
        </Reveal>
        <div className="mx-auto mt-12 max-w-3xl">
          {[
            ...telehealthSteps,
            {
              step: "04",
              title: "Anywhere, Anytime",
              text: "WhatsApp, phone, or secure messaging - structured care that fits around your life.",
            },
          ].map((t, i) => (
            <Reveal key={t.step} delay={i * 0.06}>
              <div className="flex items-start gap-6 border-b border-line py-7 first:pt-0">
                <span className="font-display text-4xl font-semibold text-forest-200">{t.step}</span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Modalities */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>What you can expect</Kicker>
            <h2 className="mt-4">A complete remote consultation.</h2>
            <p className="mt-4 text-[15px] text-muted">
              Everything you would get from an in-clinic visit, delivered wherever you are.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {modalities.map((m, i) => (
            <Reveal key={m.title} delay={(i % 2) * 0.08}>
              <div className="flex h-full items-start gap-4 rounded-lg border border-line bg-cream p-7 transition-all hover:border-forest-300 hover:shadow-lift">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.tile} shadow-lift`}>
                  {m.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{m.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Container className="mt-12 flex flex-col gap-3 sm:flex-row">
          <a
            href={waLink("Hello S19 Herbal Clinic, I would like to book a Tele-health online consultation.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-forest-900"
          >
            <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
            Book Virtual Consult Now
          </a>
          <a
            href={`tel:${CLINIC.phoneHref}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-6 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-forest-500 hover:text-forest-800"
          >
            {CLINIC.phone}
          </a>
        </Container>
      </Section>

      <CTABand title="Consult S19 specialists from anywhere" text="Connect directly with S19 Herbal Clinic specialists right now, from Cameroon or anywhere in the world." />
    </>
  );
}