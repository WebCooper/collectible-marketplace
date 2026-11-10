"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight } from "lucide-react";
import { loginSchema } from "@/lib/validations/login-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";

const emailSchema = loginSchema.shape.email;

/**
 * Lets someone who registered earlier (but never confirmed their code)
 * activate the account. Reached from the sign-in error or /verify?email=...
 */
export function VerifyAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [confirmedEmail, setConfirmedEmail] = useState(
    emailSchema.safeParse(initialEmail).success ? initialEmail.trim() : "",
  );
  const [emailError, setEmailError] = useState<string>();

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      return;
    }
    setConfirmedEmail(parsed.data);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-serif">
          Verify Your Account
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          New accounts must confirm the 6-digit code sent by e-mail before signing in.
        </p>
      </div>

      {confirmedEmail ? (
        <>
          <VerifyOtpForm email={confirmedEmail} onVerified={() => router.replace("/listings")} />
          <button
            type="button"
            onClick={() => setConfirmedEmail("")}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
          >
            Use a different e-mail address
          </button>
        </>
      ) : (
        <form onSubmit={handleEmail} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.lk"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(undefined);
              }}
              leftIcon={<Mail className="h-4 w-4" />}
              error={emailError}
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full font-semibold gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href="/login" className="text-ink font-semibold underline underline-offset-4 decoration-line-strong hover:decoration-ink">
          Sign in
        </Link>
      </div>
    </div>
  );
}
