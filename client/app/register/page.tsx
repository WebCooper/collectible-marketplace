"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard, PASSWORD_HINT, PASSWORD_PATTERN } from "@/components/AuthCard";
import { ErrorText, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Register />
    </Suspense>
  );
}

function Register() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<"BUYER" | "SELLER">(
    params.get("role") === "SELLER" ? "SELLER" : "BUYER",
  );
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.auth.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role,
      });
      toast(res.message, "info");
      router.push(`/verify?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Sri Lanka's collectible community."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">Sign in</Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["BUYER", "SELLER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg py-2 text-sm font-medium transition ${role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            {r === "BUYER" ? "I want to collect" : "I want to sell"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" autoComplete="name" minLength={2} maxLength={100} value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Mobile (optional)</label>
          <input id="phone" type="tel" className="input" placeholder="+94771234567" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete="new-password" pattern={PASSWORD_PATTERN} title={PASSWORD_HINT} value={form.password} onChange={set("password")} required />
          <p className="mt-1 text-xs text-slate-400">{PASSWORD_HINT}</p>
        </div>
        <ErrorText>{error}</ErrorText>
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Spinner className="size-4" />} Create {role === "SELLER" ? "seller" : "collector"} account
        </button>
      </form>
    </AuthCard>
  );
}
