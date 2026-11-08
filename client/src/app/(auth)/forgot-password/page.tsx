import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Forgot Password | ${SITE_NAME}`,
  description: "Request a link to reset your password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
