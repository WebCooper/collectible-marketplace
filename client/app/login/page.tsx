"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { ErrorText, PageLoader, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Login />
    </Suspense>
  );
}

/** Only follow same-site relative redirects. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function Login() {
  const params = useSearchParams();
  const router = useRouter();
  const { reload } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setUnverified(false);
    try {
      const session = await api.auth.login(email.trim(), password);
      await reload();
      toast(`Welcome back, ${session.user.name.split(" ")[0]}!`);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      if (err instanceof ApiError && /verif/i.test(message)) setUnverified(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to bid, buy and manage your collection."
      footer={
        <>
          New to CeylonCollect?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-emerald-700 hover:underline">Forgot password?</Link>
          </div>
          <input id="password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <ErrorText>{error}</ErrorText>
        {unverified && (
          <Link href={`/verify?email=${encodeURIComponent(email)}`} className="block text-sm font-medium text-emerald-700 hover:underline">
            Verify your e-mail with a code →
          </Link>
        )}
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Spinner className="size-4" />} Sign in
        </button>
      </form>
    </AuthCard>
  );
}
