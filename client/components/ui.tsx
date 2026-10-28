"use client";

import Link from "next/link";
import { useEffect } from "react";
import { humanize, initials } from "@/lib/format";

const STATUS_TONES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PAID: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  SCHEDULED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  INITIATED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OPEN: "bg-amber-50 text-amber-700 ring-amber-600/20",
  MORE_EVIDENCE_REQUESTED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OUTBID: "bg-orange-50 text-orange-700 ring-orange-600/20",
  SOLD: "bg-violet-50 text-violet-700 ring-violet-600/20",
  ENDED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  EXPIRED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  WITHDRAWN: "bg-slate-100 text-slate-600 ring-slate-500/20",
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-500/20",
  LOST: "bg-slate-100 text-slate-600 ring-slate-500/20",
  REMOVED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  REFUNDED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
    >
      {humanize(status)}
    </span>
  );
}

export function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-600 font-medium text-white shadow-sm ${small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
      title="Authenticity verified by an expert appraiser"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-24 text-emerald-700">
      <Spinner className="size-8" />
    </div>
  );
}

export function Avatar({
  name,
  url,
  size = "size-10",
}: {
  name: string;
  url?: string | null;
  size?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={`${size} rounded-full object-cover`} />;
  }
  return (
    <span
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800`}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-50 text-2xl">
        🪙
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="animate-fade-in rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {children}
    </p>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button className="btn btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span className="px-3 text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-outline"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade-in fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-up card w-full max-w-md p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button className="btn-ghost rounded-md p-1" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
            value === t.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-emerald-700">
      ← {children}
    </Link>
  );
}
