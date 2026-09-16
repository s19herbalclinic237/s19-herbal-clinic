import type { Metadata } from "next";
import { ComingSoon } from "@/components/auth/coming-soon";
import { CTABand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Your account",
  description:
    "The S19 Herbal Clinic patient portal is coming soon. Track orders, manage testimonials, and receive clinic messages in one place.",
};

export default function AccountPage() {
  return (
    <>
      <ComingSoon />
      <div className="border-t border-line bg-white">
        <CTABand />
      </div>
    </>
  );
}