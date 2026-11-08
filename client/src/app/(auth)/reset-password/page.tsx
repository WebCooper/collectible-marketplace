import { Suspense } from "react";
import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Reset Password | ${SITE_NAME}`,
  description: "Choose a new password for your account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
