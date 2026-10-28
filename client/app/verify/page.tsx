"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { ErrorText, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const params = useSearchParams();
  const router = useRouter();
  const { reload } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.auth.verifyOtp(email.trim(), code.trim());
      await reload();
      toast("Your account is active. Welcome!");
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) return setError("Enter your e-mail first.");
    setResending(true);
    try {
      const res = await api.auth.resendOtp(email.trim());
      toast(res.message, "info");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard title="Verify your e-mail" subtitle="Enter the 6-digit code we sent you. Codes expire after 10 minutes.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="code">Verification code</label>
          <input
            id="code"
            className="input text-center font-mono text-2xl tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <button className="btn btn-primary w-full py-3" disabled={busy || code.length !== 6}>
          {busy && <Spinner className="size-4" />} Verify and continue
        </button>
        <button type="button" className="btn btn-ghost w-full" onClick={resend} disabled={resending}>
          {resending ? "Sending…" : "Send me a new code"}
        </button>
      </form>
    </AuthCard>
  );
}
