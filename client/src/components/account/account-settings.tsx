"use client";

import { useState } from "react";
import { errorMessage, usersApi, type UserProfile } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/providers/auth-provider";
import { passwordSchema, sriLankanPhoneSchema, normalizeSriLankanPhone } from "@/lib/validations/signup-schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { formatDateTime } from "@/lib/utils";

/** Profile (PATCH /users/me) and password (PATCH /users/me/password). */
export function AccountSettings() {
  const { data: profile, error } = useApiQuery("profile", () => usersApi.me());
  return (
    <PageContainer>
      <PageHeader title="My account" description="Your public profile and sign-in details." />
      {error !== undefined && <Alert variant="error">{errorMessage(error)}</Alert>}
      {!profile && error === undefined && <div className="h-40 rounded-md bg-surface animate-pulse" />}
      {profile && <ProfileForm key={profile.id} profile={profile} />}
      <PasswordForm />
    </PageContainer>
  );
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const { reload } = useAuth();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setFormError(null);
    const next: Record<string, string> = {};
    if (name.trim().length < 2 || name.trim().length > 100) next.name = "Name must be 2–100 characters";
    const phoneValue = phone.trim() ? normalizeSriLankanPhone(phone) : "";
    if (phoneValue && !sriLankanPhoneSchema.safeParse(phone).success) next.phone = "Enter a valid Sri Lankan number";
    if (avatarUrl.trim() && !URL.canParse(avatarUrl.trim())) next.avatarUrl = "Must be a full URL (https://…)";
    if (bio.length > 500) next.bio = "Bio must not exceed 500 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await usersApi.updateProfile({
        name: name.trim(),
        phone: phoneValue || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await reload();
      setSaved(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4 max-w-xl" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}
          {saved && <Alert variant="success">Profile updated.</Alert>}
          <p className="text-xs text-muted-foreground">
            {profile.email} · {profile.role.toLowerCase()} · member since {formatDateTime(profile.createdAt)}
          </p>
          <div><Label htmlFor="name" required>Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} /></div>
          <div><Label htmlFor="phone">Mobile number</Label><Input id="phone" value={phone} placeholder="+94771234567" onChange={(e) => setPhone(e.target.value)} error={errors.phone} /></div>
          <div><Label htmlFor="avatarUrl">Profile picture link</Label><Input id="avatarUrl" value={avatarUrl} placeholder="https://…" onChange={(e) => setAvatarUrl(e.target.value)} error={errors.avatarUrl} /></div>
          <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} error={errors.bio} /></div>
          <Button type="submit" variant="gold" isLoading={busy}>Save profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const { signOut } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "Enter your current password";
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) next.newPassword = parsed.error.issues[0]?.message ?? "Invalid password";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setDone(true);
      // The API invalidates every earlier session when the password changes.
      window.setTimeout(() => void signOut().catch(() => undefined), 2500);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4 max-w-xl" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}
          {done && <Alert variant="success">Password changed. For your security you will be signed out so you can sign in again.</Alert>}
          <div><Label htmlFor="currentPassword" required>Current password</Label><Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} /></div>
          <div><Label htmlFor="newPassword" required>New password</Label><Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} error={errors.newPassword} /></div>
          <Button type="submit" variant="gold" isLoading={busy} disabled={done}>Change password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
