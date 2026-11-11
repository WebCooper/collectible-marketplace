"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Flag } from "lucide-react";
import { errorMessage, reportsApi } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { loginHref } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** "Report this listing" (POST /reports) for counterfeits, misleading photos, etc. */
export function ReportListing({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (user?.id === sellerId) return null;

  if (status === "guest") {
    return (
      <Link href={loginHref(pathname)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink">
        <Flag className="h-3.5 w-3.5" /> Sign in to report this listing
      </Link>
    );
  }
  if (status !== "authenticated") return null;

  if (sent) return <Alert variant="success">Thanks — a moderator will review your report.</Alert>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10 || reason.trim().length > 200) {
      setReasonError("Reason must be between 10 and 200 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reportsApi.create({
        targetType: "LISTING",
        reportedListingId: listingId,
        reason: reason.trim(),
        details: details.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink cursor-pointer">
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-line bg-white p-4" noValidate>
      <h3 className="text-sm font-semibold text-ink">Report this listing</h3>
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <Label htmlFor="report-reason" required>What is wrong?</Label>
        <Input id="report-reason" value={reason} maxLength={200} placeholder="Appears to be a counterfeit" onChange={(e) => { setReason(e.target.value); setReasonError(undefined); }} error={reasonError} />
      </div>
      <div>
        <Label htmlFor="report-details">More detail</Label>
        <Textarea id="report-details" maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" isLoading={busy}>Send report</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
