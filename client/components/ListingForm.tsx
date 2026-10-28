"use client";

import { useState } from "react";
import { CATEGORIES, CONDITIONS } from "@/lib/format";
import type { Category, ItemCondition, ListingInput, ListingType } from "@/lib/types";
import { ItemImage } from "./ListingCard";
import { ErrorText, Spinner } from "./ui";

export interface ListingFormValues {
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  era: string;
  denomination: string;
  startingPrice: string;
  listingType: ListingType;
  images: string[];
  certificates: { fileUrl: string; fileName: string; issuer: string }[];
}

export const EMPTY_LISTING: ListingFormValues = {
  title: "",
  description: "",
  category: "OLD_COINS",
  condition: "VERY_GOOD",
  era: "",
  denomination: "",
  startingPrice: "",
  listingType: "FIXED_PRICE",
  images: [],
  certificates: [],
};

export function toListingInput(v: ListingFormValues): ListingInput {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    category: v.category,
    condition: v.condition,
    era: v.era.trim() || undefined,
    denomination: v.denomination.trim() || undefined,
    startingPrice: Number(v.startingPrice),
    listingType: v.listingType,
    images: v.images.map((url, position) => ({ url, position })),
    certificates: v.certificates
      .filter((c) => c.fileUrl.trim())
      .map((c) => ({
        fileUrl: c.fileUrl.trim(),
        fileName: c.fileName.trim() || c.fileUrl.split("/").pop() || "certificate",
        issuer: c.issuer.trim() || undefined,
      })),
  };
}

export function ListingForm({
  initial,
  submitLabel,
  withCertificates,
  lockType,
  onSubmit,
}: {
  initial: ListingFormValues;
  submitLabel: string;
  /** Certificates can only be sent on create; later ones use their own endpoint. */
  withCertificates?: boolean;
  lockType?: boolean;
  onSubmit: (values: ListingFormValues) => Promise<void>;
}) {
  const [v, setV] = useState(initial);
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ListingFormValues>(k: K, value: ListingFormValues[K]) =>
    setV((x) => ({ ...x, [k]: value }));

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      return setError("Enter a full image URL, starting with https://");
    }
    if (v.images.length >= 10) return setError("Up to 10 images per listing.");
    set("images", [...v.images, url]);
    setImageUrl("");
    setError("");
  }

  function moveImage(i: number, dir: -1 | 1) {
    const images = [...v.images];
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    [images[i], images[j]] = [images[j]!, images[i]!];
    set("images", images);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(v);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">About the item</h2>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" minLength={5} maxLength={150} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="1957 Ceylon 5 Rupee Commemorative Coin" required />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" className="input min-h-36" minLength={20} maxLength={5000} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the item, its history and any wear or flaws." required />
          <p className="mt-1 text-xs text-slate-400">At least 20 characters · {v.description.length}/5000</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={v.category} onChange={(e) => set("category", e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="condition">Condition</label>
            <select id="condition" className="input" value={v.condition} onChange={(e) => set("condition", e.target.value as ItemCondition)}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="era">Era / year (optional)</label>
            <input id="era" className="input" maxLength={50} value={v.era} onChange={(e) => set("era", e.target.value)} placeholder="1957" />
          </div>
          <div>
            <label className="label" htmlFor="denomination">Denomination (optional)</label>
            <input id="denomination" className="input" maxLength={50} value={v.denomination} onChange={(e) => set("denomination", e.target.value)} placeholder="5 Rupees" />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Pricing</h2>
        {!lockType && (
          <div className="grid grid-cols-2 gap-3">
            {(["FIXED_PRICE", "AUCTION"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => set("listingType", t)}
                className={`rounded-xl border-2 p-4 text-left transition ${v.listingType === t ? "border-emerald-600 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <p className="font-medium text-slate-900">{t === "AUCTION" ? "Auction" : "Fixed price"}</p>
                <p className="text-xs text-slate-500">{t === "AUCTION" ? "Collectors bid; schedule it after approval" : "Sell instantly at your price"}</p>
              </button>
            ))}
          </div>
        )}
        <div>
          <label className="label" htmlFor="price">{v.listingType === "AUCTION" ? "Opening price (LKR)" : "Price (LKR)"}</label>
          <input id="price" type="number" min={1} step="0.01" className="input" value={v.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} placeholder="18500" required />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div>
          <h2 className="font-semibold text-slate-900">Photos</h2>
          <p className="text-sm text-slate-500">Show multiple angles. The first image is the cover. Paste URLs of uploaded images.</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
            placeholder="https://storage.example/coin-front.jpg"
          />
          <button type="button" className="btn btn-outline shrink-0" onClick={addImage}>Add</button>
        </div>
        {v.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {v.images.map((url, i) => (
              <div key={url + i} className="group animate-fade-in relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                <ItemImage url={url} alt="" className="size-full" />
                {i === 0 && <span className="absolute top-1 left-1 rounded bg-emerald-600 px-1.5 text-[10px] text-white">Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 opacity-0 transition group-hover:opacity-100">
                  <button type="button" className="px-1 text-xs" onClick={() => moveImage(i, -1)} aria-label="Move left">←</button>
                  <button type="button" className="px-1 text-xs text-rose-600" onClick={() => set("images", v.images.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
                  <button type="button" className="px-1 text-xs" onClick={() => moveImage(i, 1)} aria-label="Move right">→</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {withCertificates && (
        <section className="card space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-slate-900">Authenticity certificates (optional)</h2>
            <p className="text-sm text-slate-500">Certificates speed up expert review and earn a Verified badge.</p>
          </div>
          {v.certificates.map((c, i) => (
            <div key={i} className="animate-fade-in grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <input className="input" type="url" placeholder="Certificate file URL" value={c.fileUrl} onChange={(e) => set("certificates", v.certificates.map((x, j) => (j === i ? { ...x, fileUrl: e.target.value } : x)))} required />
              <input className="input" placeholder="File name" maxLength={255} value={c.fileName} onChange={(e) => set("certificates", v.certificates.map((x, j) => (j === i ? { ...x, fileName: e.target.value } : x)))} />
              <input className="input" placeholder="Issuer" maxLength={150} value={c.issuer} onChange={(e) => set("certificates", v.certificates.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))} />
              <button type="button" className="btn btn-ghost" onClick={() => set("certificates", v.certificates.filter((_, j) => j !== i))} aria-label="Remove certificate">✕</button>
            </div>
          ))}
          {v.certificates.length < 5 && (
            <button type="button" className="btn btn-outline" onClick={() => set("certificates", [...v.certificates, { fileUrl: "", fileName: "", issuer: "" }])}>
              + Add certificate
            </button>
          )}
        </section>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="flex justify-end">
        <button className="btn btn-primary px-8 py-3" disabled={busy}>
          {busy && <Spinner className="size-4" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
