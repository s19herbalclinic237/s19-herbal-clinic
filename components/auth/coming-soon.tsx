import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaLock, FaArrowRight } from "react-icons/fa6";

export function ComingSoon() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-forest-950">
      <img
        src={S19_ASSETS.photos.nutritionBasketOutreach}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/80 to-forest-950/40" />
      <Container className="relative z-10 py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-gold-400/40 bg-gold-400/10 text-gold-400">
            <FaLock className="h-6 w-6" aria-hidden />
          </div>
          <Kicker center dark>
            User Portal
          </Kicker>
          <h1 className="mt-4 text-balance text-white">Coming Soon.</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-forest-100/90 md:text-base">
            The S19 patient portal is being prepared for you. Soon you will be able to track
            orders, manage your testimonials, receive clinic messages, and more - all in one
            place. Follow our WhatsApp for early access.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className={buttonLinkClasses("gold", "lg")}>
              Book a Consultation
              <FaArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/" className={buttonLinkClasses("glass", "lg")}>
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}