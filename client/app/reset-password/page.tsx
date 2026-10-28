"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard, PASSWORD_HINT, PASSWORD_PATTERN } from "@/components/AuthCard";
import { ErrorText, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Reset />
    </Suspense>
  );
}

function Reset() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true);
    setError("");
    try {
      const res = await api.auth.resetPassword(token.trim(), password);
      setDone(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Choose a new password" subtitle="All other sessions will be signed out.">
      {done ? (
        <div className="animate-fade-in space-y-4">
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{done}</p>
          <Link href="/login" className="btn btn-primary w-full">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {!params.get("token") && (
            <div>
              <label className="label" htmlFor="token">Reset token</label>
              <input id="token" className="input" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" type="password" className="input" autoComplete="new-password" pattern={PASSWORD_PATTERN} title={PASSWORD_HINT} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="mt-1 text-xs text-slate-400">{PASSWORD_HINT}</p>
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="size-4" />} Update password
          </button>
        </form>
      )}
    </AuthCard>
  );
}
