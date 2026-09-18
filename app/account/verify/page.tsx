import { Suspense } from "react";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata = {
  title: "Verify email | S19 Herbal Clinic",
  description: "Confirm your email address for your S19 Herbal Clinic account.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPanel />
    </Suspense>
  );
}