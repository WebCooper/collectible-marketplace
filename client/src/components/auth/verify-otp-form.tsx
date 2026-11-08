"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, ArrowRight, RotateCw } from "lucide-react";
import { authApi, errorMessage, type Session } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { otpSchema } from "@/lib/validations/signup-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Confirms the 6-digit code e-mailed after registration
 * (POST /auth/verify-otp). Success activates the account and signs the user
 * in - the API sets the session cookies in the same response.
 */
export function VerifyOtpForm({
  email,
  onVerified,
}: {
  email: string;
  onVerified: (session: Session) => void;
}) {
  const { acceptSession } = useAuth();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    const parsed = otpSchema.safeParse({ code });
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message);
      return;
    }

    setIsVerifying(true);
    try {
      const session = await authApi.verifyOtp({ email, code: parsed.data.code });
      acceptSession(session);
      onVerified(session);
    } catch (error) {
      setFormError(errorMessage(error, "That code could not be verified."));
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setFormError(null);
    setIsResending(true);
    try {
      const { message } = await authApi.resendOtp({ email });
      setNotice(message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setFormError(errorMessage(error, "Could not send a new code."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4" noValidate>
      <Alert variant="info">
        <p>
          We sent a 6-digit verification code to{" "}
          <span className="font-semibold text-white">{email}</span>. It expires in 10 minutes.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-zinc-400">
            Development: no e-mail is sent - the code is printed in the backend API log.
          </p>
        )}
      </Alert>

      {formError && <Alert variant="error">{formError}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div>
        <Label htmlFor="code" required>
          Verification Code
        </Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="482913"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setCodeError(undefined);
          }}
          leftIcon={<KeyRound className="h-4 w-4" />}
          error={codeError}
          className="font-mono tracking-[0.4em]"
        />
      </div>

      <Button
        type="submit"
        variant="gold"
        size="lg"
        isLoading={isVerifying}
        className="w-full text-xs uppercase tracking-wider font-semibold gap-2 font-mono"
      >
        <span>Verify &amp; Activate Account</span>
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#f1d27a] disabled:opacity-50 disabled:hover:text-zinc-400 font-mono"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </button>
      </div>
    </form>
  );
}
