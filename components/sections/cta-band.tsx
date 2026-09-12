import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonLinkClasses } from "@/components/ui/button";
import GradientWaves from "@/components/ui/gradient-waves";
import { CLINIC } from "@/lib/site";
import { FaWhatsapp } from "react-icons/fa6";

export function WhatsAppFloat() {
  return (
    <Link
      href={`https://wa.me/${CLINIC.whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with S19 on WhatsApp"
      className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 text-white shadow-lift ring-1 ring-gold-400/60 transition-all hover:scale-105 hover:bg-forest-800"
    >
      <FaWhatsapp className="h-5 w-5" aria-hidden />
    </Link>
  );
}

export function CTABand({
  title = "Start your health assessment",
  text = "Book a priority in-clinic appointment or a Tele-health consultation with the S19 clinic today.",
  primaryLabel = "Book an Assessment",
  primaryHref = "/contact",
  secondaryLabel = "WhatsApp: +237 672 595 989",
}: {
  title?: string;
  text?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <GradientWaves
          horizonColor="#062b16"
          waveColor="#0f5d2e"
          crestColor="#3f7c45"
          speed={0.4}
          amplitude={2.4}
          waveScale={0.6}
          waveRatio={0.9}
          swell={38}
          turbulence={18}
          tilt={1.14}
          height={5.5}
          fogDepth={16}
          detail="low"
          brightness={0.62}
          opacity={0.85}
          mouseInteraction
          parallaxStrength={0.4}
          grain
          grainIntensity={0.05}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950/80 via-forest-950/55 to-forest-950/75" />
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <Container className="relative z-10 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-[#dcf2e7]">{title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-forest-100/90">{text}</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={primaryHref} className={buttonLinkClasses("gold", "xl")}>
            {primaryLabel}
          </Link>
          <a
            href={CLINIC.phoneHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
            {secondaryLabel}
          </a>
        </div>
      </Container>
    </section>
  );
}