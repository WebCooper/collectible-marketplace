"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { ErrorText, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.auth.forgotPassword(email.trim());
      setSent(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll e-mail you a link to choose a new one."
      footer={<Link href="/login" className="font-medium text-emerald-700 hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <p className="animate-fade-in rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{sent}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="size-4" />} Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
