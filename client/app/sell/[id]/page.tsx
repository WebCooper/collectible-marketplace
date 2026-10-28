"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListingForm, toListingInput, type ListingFormValues } from "@/components/ListingForm";
import { RequireAuth } from "@/components/RequireAuth";
import { BackLink, EmptyState, ErrorText, Modal, PageLoader, Spinner, StatusBadge, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Certificate, ListingDetail } from "@/lib/types";

export default function ManageListingPage() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <Manage />
    </RequireAuth>
  );
}

type Section = "overview" | "edit" | "certificates" | "auction";

function Manage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadError, setLoadError] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      Promise.all([api.listings.get(id), api.listings.certificates(id)]).then(
        ([l, certs]) => {
          setListing(l);
          setCertificates(certs);
        },
        (err: Error) => setLoadError(err.message),
      ),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title="Listing unavailable" text={loadError} action={<Link href="/sell" className="btn btn-primary">Seller dashboard</Link>} />
      </div>
    );
  }
  if (!listing) return <PageLoader />;

  const hasBids = (listing.auction?.bidCount ?? 0) > 0;
  const closed = ["SOLD", "WITHDRAWN", "EXPIRED", "REMOVED"].includes(listing.status);
  const editable = !hasBids && !["SOLD", "WITHDRAWN"].includes(listing.status) && listing.auction?.status !== "ENDED";
  const canSchedule = !listing.auction && ["UNDER_REVIEW", "ACTIVE"].includes(listing.status);
  const feedback = listing.verifications.find((v) => v.decision !== "APPROVED" && v.comments);

  const tabs: { value: Section; label: string }[] = [
    { value: "overview", label: "Overview" },
    ...(editable ? [{ value: "edit" as const, label: "Edit" }] : []),
    { value: "certificates", label: `Certificates (${certificates.length})` },
    ...(canSchedule || listing.auction ? [{ value: "auction" as const, label: "Auction" }] : []),
  ];

  async function withdraw() {
    setBusy(true);
    setError("");
    try {
      await api.listings.withdraw(id);
      toast("Listing withdrawn");
      setWithdrawOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const initialValues: ListingFormValues = {
    title: listing.title,
    description: listing.description,
    category: listing.category,
    condition: listing.condition,
    era: listing.era ?? "",
    denomination: listing.denomination ?? "",
    startingPrice: String(Number(listing.startingPrice)),
    listingType: listing.listingType,
    images: listing.images.map((i) => i.url),
    certificates: [],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <BackLink href="/sell">Seller dashboard</BackLink>
      <div className="animate-fade-up mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.isVerified && <span className="text-xs font-medium text-emerald-700">✓ Verified</span>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {money(listing.startingPrice)} · {listing.listingType === "AUCTION" ? "Auction" : "Fixed price"} · {listing.viewCount} views
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/listings/${listing.id}`} className="btn btn-outline">View listing</Link>
          {!closed && !hasBids && (
            <button className="btn btn-danger" onClick={() => setWithdrawOpen(true)}>Withdraw</button>
          )}
        </div>
      </div>

      {listing.status === "UNDER_REVIEW" && (
        <div className="animate-fade-in mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Awaiting expert review</p>
          <p className="mt-0.5 text-amber-800">An appraiser will check your listing and certificates. You&apos;ll get a notification with the decision.</p>
        </div>
      )}
      {feedback && listing.status !== "ACTIVE" && (
        <div className="animate-fade-in mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
          <p className="font-medium text-rose-800">
            {feedback.decision === "MORE_EVIDENCE_REQUESTED" ? "The appraiser needs more evidence" : "Your listing was not approved"}
          </p>
          <p className="mt-1 text-rose-700">“{feedback.comments}” — {feedback.appraiser.name}</p>
          {feedback.decision === "MORE_EVIDENCE_REQUESTED" && (
            <button className="mt-2 font-medium text-rose-800 underline" onClick={() => setSection("certificates")}>Add a certificate →</button>
          )}
        </div>
      )}

      <Tabs tabs={tabs} value={section} onChange={setSection} />

      <div key={section} className="animate-fade-in">
        {section === "overview" && <Overview listing={listing} />}

        {section === "edit" && (
          <>
            <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Saving any change sends the listing back to expert review and removes the Verified badge until it is re-approved.
            </p>
            <ListingForm
              initial={initialValues}
              submitLabel="Save and resubmit"
              lockType={!!listing.auction}
              onSubmit={async (values) => {
                const { certificates: _unused, ...input } = toListingInput(values);
                void _unused;
                await api.listings.update(id, input);
                toast("Changes saved — your listing is back in review.");
                setSection("overview");
                await load();
              }}
            />
          </>
        )}

        {section === "certificates" && (
          <CertificatesSection id={id} certificates={certificates} disabled={listing.status === "SOLD"} onAdded={load} />
        )}

        {section === "auction" &&
          (listing.auction ? (
            <div className="card space-y-3 p-6 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Auction</h2>
                <StatusBadge status={listing.auction.status} />
              </div>
              <Row label="Opening price" value={money(listing.auction.startPrice)} />
              <Row label="Current price" value={money(listing.auction.currentPrice)} />
              <Row label="Minimum increment" value={money(listing.auction.minIncrement)} />
              {listing.auction.buyNowPrice && <Row label="Buy Now price" value={money(listing.auction.buyNowPrice)} />}
              <Row label="Bids" value={String(listing.auction.bidCount)} />
              <Row label="Opens" value={dateTime(listing.auction.startTime)} />
              <Row label="Closes" value={dateTime(listing.auction.endTime)} />
              <Link href={`/listings/${listing.id}`} className="btn btn-outline mt-2">Watch live →</Link>
            </div>
          ) : (
            <AuctionForm id={id} startingPrice={listing.startingPrice} activeListing={listing.status === "ACTIVE"} onCreated={load} />
          ))}
      </div>

      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw this listing?">
        <p className="text-sm text-slate-600">It will be removed from the marketplace. This cannot be undone.</p>
        <div className="mt-4"><ErrorText>{error}</ErrorText></div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={() => setWithdrawOpen(false)}>Keep listing</button>
          <button className="btn btn-danger" disabled={busy} onClick={withdraw}>{busy && <Spinner className="size-4" />} Withdraw</button>
        </div>
      </Modal>
    </div>
  );
}

function Overview({ listing }: { listing: ListingDetail }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-2 font-semibold text-slate-900">Description</h2>
        <p className="text-sm whitespace-pre-line text-slate-600">{listing.description}</p>
      </div>
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Review history</h2>
        {listing.verifications.length === 0 ? (
          <p className="text-sm text-slate-500">No decisions yet.</p>
        ) : (
          <ul className="space-y-3">
            {listing.verifications.map((v) => (
              <li key={v.id} className="flex flex-wrap items-start gap-3 text-sm">
                <StatusBadge status={v.decision} />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-500">{dateTime(v.verifiedAt)} · {v.appraiser.name}{v.appraisedValue ? ` · valued at ${money(v.appraisedValue)}` : ""}</p>
                  {v.comments && <p className="text-slate-700">{v.comments}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CertificatesSection({
  id,
  certificates,
  disabled,
  onAdded,
}: {
  id: string;
  certificates: Certificate[];
  disabled: boolean;
  onAdded: () => Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ fileUrl: "", fileName: "", issuer: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.listings.addCertificate(id, {
        fileUrl: form.fileUrl.trim(),
        fileName: form.fileName.trim(),
        issuer: form.issuer.trim() || undefined,
      });
      toast("Certificate added — the listing is back in review.");
      setForm({ fileUrl: "", fileName: "", issuer: "" });
      await onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card divide-y divide-slate-100">
        {certificates.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No certificates attached yet.</p>
        ) : (
          certificates.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div className="min-w-0">
                {c.fileUrl ? (
                  <a href={c.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline">📄 {c.fileName}</a>
                ) : (
                  <p className="font-medium text-slate-800">📄 {c.fileName}</p>
                )}
                <p className="text-xs text-slate-500">{c.issuer ? `${c.issuer} · ` : ""}Uploaded {dateTime(c.uploadedAt)}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))
        )}
      </div>
      {!disabled && (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <h2 className="font-semibold text-slate-900">Attach a certificate</h2>
          <div>
            <label className="label" htmlFor="cert-url">File URL</label>
            <input id="cert-url" type="url" className="input" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://storage.example/cert.pdf" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cert-name">File name</label>
              <input id="cert-name" className="input" maxLength={255} value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="ncs-certificate-1957.pdf" required />
            </div>
            <div>
              <label className="label" htmlFor="cert-issuer">Issuer (optional)</label>
              <input id="cert-issuer" className="input" maxLength={150} value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Numismatic Society of Sri Lanka" />
            </div>
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end">
            <button className="btn btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Attach certificate</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** <input type="datetime-local"> value for a Date, in local time. */
function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AuctionForm({
  id,
  startingPrice,
  activeListing,
  onCreated,
}: {
  id: string;
  startingPrice: string;
  activeListing: boolean;
  onCreated: () => Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    startPrice: String(Number(startingPrice)),
    minIncrement: "500",
    startTime: "",
    endTime: localInput(new Date(Date.now() + 7 * 86400_000)),
    buyNowPrice: "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.listings.createAuction(id, {
        startPrice: Number(form.startPrice),
        minIncrement: Number(form.minIncrement),
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: new Date(form.endTime).toISOString(),
        buyNowPrice: form.buyNowPrice ? Number(form.buyNowPrice) : undefined,
      });
      toast("Auction scheduled!");
      await onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <h2 className="font-semibold text-slate-900">Schedule an auction</h2>
        <p className="text-sm text-slate-500">
          {activeListing
            ? "Collectors can bid as soon as the auction opens."
            : "You can set this up now; bidding opens once an appraiser approves the listing."}{" "}
          Bids in the last 2 minutes extend the close by 2 minutes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="sp">Opening price (LKR)</label>
          <input id="sp" type="number" min={1} step="0.01" className="input" value={form.startPrice} onChange={set("startPrice")} required />
        </div>
        <div>
          <label className="label" htmlFor="mi">Min increment (LKR)</label>
          <input id="mi" type="number" min={1} step="0.01" className="input" value={form.minIncrement} onChange={set("minIncrement")} required />
        </div>
        <div>
          <label className="label" htmlFor="bn">Buy Now (optional)</label>
          <input id="bn" type="number" min={1} step="0.01" className="input" value={form.buyNowPrice} onChange={set("buyNowPrice")} placeholder="35000" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="st">Opens (leave blank for now)</label>
          <input id="st" type="datetime-local" className="input" value={form.startTime} onChange={set("startTime")} />
        </div>
        <div>
          <label className="label" htmlFor="et">Closes</label>
          <input id="et" type="datetime-local" className="input" value={form.endTime} onChange={set("endTime")} required />
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Schedule auction</button>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
