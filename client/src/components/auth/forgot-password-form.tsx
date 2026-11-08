"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { authApi, errorMessage } from "@/lib/api";
import { loginSchema } from "@/lib/validations/login-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const emailSchema = loginSchema.shape.email;

/** POST /auth/forgot-password - same answer whether or not the e-mail exists. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      return;
    }

    setIsLoading(true);
    try {
      const { message } = await authApi.forgotPassword({ email: parsed.data });
      setSentMessage(message);
    } catch (error) {
      setFormError(errorMessage(error, "Could not request a reset link."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Reset Your Password
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Enter your account e-mail and we will send you a link to choose a new password.
        </p>
      </div>

      {sentMessage ? (
        <Alert variant="success">
          <p>{sentMessage}</p>
          <p className="text-zinc-400">The link is valid for 30 minutes and can be used once.</p>
          {process.env.NODE_ENV !== "production" && (
            <p className="text-zinc-400">
              Development: no e-mail is sent. The reset token is saved in the payload of the
              user&apos;s newest &quot;Reset your password&quot; notification (browse it with{" "}
              <code className="text-[#f1d27a]">npm run prisma:studio</code> in backend/), then open{" "}
              <code className="text-[#f1d27a]">/reset-password?token=…</code>
            </p>
          )}
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}
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
            isLoading={isLoading}
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 font-mono"
          >
            <span>Send Reset Link</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-zinc-400 font-mono">
        Remembered it?{" "}
        <Link href="/login" className="text-[#f1d27a] font-semibold hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
