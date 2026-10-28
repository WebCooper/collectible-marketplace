"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { ErrorText, Modal, Spinner } from "./ui";

/** "Report" link + dialog for a suspicious listing or user (POST /reports). */
export function ReportButton({
  target,
  id,
  label = "Report",
}: {
  target: "LISTING" | "USER";
  id: string;
  label?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.reports.create({
        targetType: target,
        reportedListingId: target === "LISTING" ? id : undefined,
        reportedUserId: target === "USER" ? id : undefined,
        reason: reason.trim(),
        details: details.trim() || undefined,
      });
      toast("Thanks — our moderators will review this report.");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-rose-600"
        onClick={() => (user ? setOpen(true) : router.push("/login"))}
      >
        ⚑ {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={target === "LISTING" ? "Report this listing" : "Report this user"}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="report-reason">Reason</label>
            <input
              id="report-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Looks like a modern replica sold as genuine"
              minLength={10}
              maxLength={200}
              required
            />
            <p className="mt-1 text-xs text-slate-400">10–200 characters</p>
          </div>
          <div>
            <label className="label" htmlFor="report-details">Details (optional)</label>
            <textarea
              id="report-details"
              className="input min-h-24"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy && <Spinner className="size-4" />} Submit report
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
