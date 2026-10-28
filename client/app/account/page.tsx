"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PASSWORD_HINT, PASSWORD_PATTERN } from "@/components/AuthCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar, ErrorText, PageHeader, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { date, humanize } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Profile } from "@/lib/types";

export default function AccountPage() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}

function Account() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Account settings" subtitle="Manage your profile and security." />
      <div className="animate-fade-up card mb-6 flex items-center gap-4 p-6">
        <Avatar name={user.name} url={user.avatarUrl} size="size-16" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs text-slate-400">Member since {date(user.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{humanize(user.role)}</span>
          <StatusBadge status={user.status} />
        </div>
      </div>
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user: Profile }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    bio: user.bio ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await api.users.update({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
        bio: form.bio.trim(),
      });
      setUser(updated);
      toast("Profile updated");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="animate-fade-up card mb-6 space-y-4 p-6">
      <h2 className="font-semibold text-slate-900">Profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" minLength={2} maxLength={100} value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Mobile</label>
          <input id="phone" type="tel" className="input" placeholder="+94771234567" value={form.phone} onChange={set("phone")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="avatar">Profile picture URL</label>
        <input id="avatar" type="url" className="input" placeholder="https://…" value={form.avatarUrl} onChange={set("avatarUrl")} />
      </div>
      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" className="input min-h-24" maxLength={500} value={form.bio} onChange={set("bio")} placeholder="Tell other collectors about yourself" />
        <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/500</p>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save changes</button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.users.changePassword(current, next);
      // Changing the password signs out every session, including this one.
      await api.auth.logout().catch(() => {});
      setUser(null);
      toast("Password changed. Please sign in again.", "info");
      router.replace("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="animate-fade-up card space-y-4 p-6">
      <div>
        <h2 className="font-semibold text-slate-900">Change password</h2>
        <p className="text-sm text-slate-500">You&apos;ll be signed out of every device.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current">Current password</label>
          <input id="current" type="password" className="input" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="new">New password</label>
          <input id="new" type="password" className="input" autoComplete="new-password" pattern={PASSWORD_PATTERN} title={PASSWORD_HINT} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
      </div>
      <p className="text-xs text-slate-400">{PASSWORD_HINT}</p>
      <ErrorText>{error}</ErrorText>
      <div className="flex justify-end">
        <button className="btn btn-outline" disabled={busy}>{busy && <Spinner className="size-4" />} Update password</button>
      </div>
    </form>
  );
}
