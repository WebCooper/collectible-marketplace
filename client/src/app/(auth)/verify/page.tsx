import { Suspense } from "react";
import { Metadata } from "next";
import { VerifyAccount } from "@/components/auth/verify-account";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Verify Your Account | ${SITE_NAME}`,
  description: "Confirm the verification code sent to your e-mail.",
};

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyAccount />
    </Suspense>
  );
}
