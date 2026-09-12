import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your S19 Herbal Clinic account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}