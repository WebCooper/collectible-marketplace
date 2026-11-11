"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileCheck2, Gavel } from "lucide-react";
import {
  auctionsApi,
  certificatesApi,
  errorMessage,
  listingsApi,
  type ListingDetail,
} from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDateTime, formatLKR } from "@/lib/utils";
import {
  auctionSchema,
  certificateSchema,
  type AuctionFormInput,
  type CertificateFormInput,
} from "@/lib/validations/listing-schema";
import { zodFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ListingForm } from "./listing-form";

/** Owner view of one listing: edit it, add certificates, schedule the auction, withdraw. */
export function ManageListing({ id }: { id: string }) {
  const created = useSearchParams().get("created") === "1";
  const { data: listing, error, loading, reload } = useApiQuery(`manage:${id}`, () => listingsApi.get(id));

  if (!listing) {
    return (
      <PageContainer>
        {error !== undefined ? (
          <Alert variant="error">{errorMessage(error)}</Alert>
        ) : (
          <div className="h-40 rounded-md bg-surface animate-pulse" aria-busy={loading} />
        )}
      </PageContainer>
    );
  }

  const hasBids = (listing.auction?.bidCount ?? 0) > 0;
  const locked = hasBids || listing.status === "SOLD" || listing.status === "WITHDRAWN";

  return (
    <PageContainer>
      <Link href="/seller/listings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All my listings
      </Link>
      <PageHeader
        title={listing.title}
        description={`Listed ${formatDateTime(listing.createdAt)} · ${formatLKR(listing.startingPrice)}`}
        action={<StatusBadge status={listing.status} />}
      />
      {created && (
        <Alert variant="success">
          Listing submitted. An appraiser will review it before it appears in the catalogue.
        </Alert>
      )}
      {listing.status === "UNDER_REVIEW" && (
        <Alert variant="info">This listing is waiting for appraiser review.</Alert>
      )}
      {listing.status === "REMOVED" && (
        <Alert variant="error">A moderator removed this listing from the marketplace.</Alert>
      )}

      {listing.listingType === "AUCTION" && (
        <AuctionSection listing={listing} onChanged={reload} />
      )}

      <CertificatesSection listing={listing} onChanged={reload} />

      <Card>
        <CardHeader><CardTitle>Listing details</CardTitle></CardHeader>
        <CardContent>
          {locked ? (
            <Alert variant="info">
              {hasBids
                ? "Bidding has started, so this listing can no longer be edited or withdrawn."
                : `A ${listing.status.toLowerCase()} listing cannot be edited.`}
            </Alert>
          ) : (
            <ListingForm listing={listing} onSaved={reload} />
          )}
        </CardContent>
      </Card>

      {!locked && <WithdrawSection listing={listing} onChanged={reload} />}
    </PageContainer>
  );
}

function AuctionSection({ listing, onChanged }: { listing: ListingDetail; onChanged: () => void }) {
  const auction = listing.auction;
  const [values, setValues] = useState<AuctionFormInput>({
    startPrice: String(Number(listing.startingPrice)),
    minIncrement: "500",
    buyNowPrice: "",
    endTime: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AuctionFormInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (auction) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Auction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Status</dt><dd className="text-right"><StatusBadge status={auction.status} /></dd>
            <dt className="text-muted-foreground">Current price</dt><dd className="text-right font-semibold tabular-nums">{formatLKR(auction.currentPrice)}</dd>
            <dt className="text-muted-foreground">Bids</dt><dd className="text-right">{auction.bidCount}</dd>
            <dt className="text-muted-foreground">Minimum raise</dt><dd className="text-right">{formatLKR(auction.minIncrement)}</dd>
            {auction.buyNowPrice && (<><dt className="text-muted-foreground">Buy Now</dt><dd className="text-right">{formatLKR(auction.buyNowPrice)}</dd></>)}
            <dt className="text-muted-foreground">Opens</dt><dd className="text-right">{formatDateTime(auction.startTime)}</dd>
            <dt className="text-muted-foreground">Closes</dt><dd className="text-right">{formatDateTime(auction.endTime)}</dd>
          </dl>
          {listing.status === "UNDER_REVIEW" && (
            <p className="text-xs text-muted-foreground">Bidding opens to buyers once the listing is approved.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = auctionSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setSubmitting(true);
    try {
      await auctionsApi.create(listing.id, {
        startPrice: Number(parsed.data.startPrice),
        minIncrement: Number(parsed.data.minIncrement),
        buyNowPrice: parsed.data.buyNowPrice ? Number(parsed.data.buyNowPrice) : undefined,
        endTime: new Date(parsed.data.endTime).toISOString(),
      });
      onChanged();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof AuctionFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Schedule the auction</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4" noValidate>
          <Alert variant="info" className="sm:col-span-2">
            This lot is an auction but bidding is not scheduled yet. Bidding opens immediately and closes at the time you choose.
          </Alert>
          {formError && <div className="sm:col-span-2"><Alert variant="error">{formError}</Alert></div>}
          <div>
            <Label htmlFor="startPrice" required>Opening price (LKR)</Label>
            <Input id="startPrice" inputMode="decimal" value={values.startPrice} onChange={(e) => set("startPrice", e.target.value)} error={errors.startPrice} />
          </div>
          <div>
            <Label htmlFor="minIncrement" required>Minimum raise (LKR)</Label>
            <Input id="minIncrement" inputMode="decimal" value={values.minIncrement} onChange={(e) => set("minIncrement", e.target.value)} error={errors.minIncrement} />
          </div>
          <div>
            <Label htmlFor="buyNowPrice">Buy Now price (optional)</Label>
            <Input id="buyNowPrice" inputMode="decimal" value={values.buyNowPrice} onChange={(e) => set("buyNowPrice", e.target.value)} error={errors.buyNowPrice} />
          </div>
          <div>
            <Label htmlFor="endTime" required>Bidding closes</Label>
            <Input id="endTime" type="datetime-local" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} error={errors.endTime} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gold" isLoading={submitting}>Start auction</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CertificatesSection({ listing, onChanged }: { listing: ListingDetail; onChanged: () => void }) {
  const { data: certificates, reload } = useApiQuery(`certs:${listing.id}`, () => certificatesApi.forListing(listing.id));
  const [values, setValues] = useState<CertificateFormInput>({ fileUrl: "", fileName: "", issuer: "" });
  const [errors, setErrors] = useState<FieldErrors<keyof CertificateFormInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = certificateSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setSubmitting(true);
    try {
      await certificatesApi.upload(listing.id, {
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        issuer: parsed.data.issuer || undefined,
      });
      setValues({ fileUrl: "", fileName: "", issuer: "" });
      reload();
      onChanged();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof CertificateFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5" /> Certificates</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {certificates?.length ? (
          <ul className="space-y-2">
            {certificates.map((cert) => (
              <li key={cert.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-4 py-3 text-sm">
                <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="truncate text-ink underline underline-offset-2">
                  {cert.fileName}
                </a>
                <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                  {cert.issuer}
                  <StatusBadge status={cert.status} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No certificates yet. Appraisers verify authenticity against them.</p>
        )}
        <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3 border-t border-line pt-4" noValidate>
          {formError && <div className="sm:col-span-3"><Alert variant="error">{formError}</Alert></div>}
          <div>
            <Label htmlFor="certUrl" required>Link to file</Label>
            <Input id="certUrl" placeholder="https://…/certificate.pdf" value={values.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} error={errors.fileUrl} />
          </div>
          <div>
            <Label htmlFor="certName" required>File name</Label>
            <Input id="certName" placeholder="certificate.pdf" value={values.fileName} onChange={(e) => set("fileName", e.target.value)} error={errors.fileName} />
          </div>
          <div>
            <Label htmlFor="certIssuer">Issuer</Label>
            <Input id="certIssuer" placeholder="Numismatic Society" value={values.issuer} onChange={(e) => set("issuer", e.target.value)} error={errors.issuer} />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" variant="secondary" isLoading={submitting}>Add certificate</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function WithdrawSection({ listing, onChanged }: { listing: ListingDetail; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      await listingsApi.withdraw(listing.id);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Withdraw listing</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Takes the listing off the marketplace. This is not possible once bidding has started.</p>
        {error && <Alert variant="error">{error}</Alert>}
        {confirming ? (
          <div className="flex gap-2">
            <Button variant="destructive" isLoading={busy} onClick={withdraw}>Yes, withdraw it</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Keep listing</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)}>Withdraw…</Button>
        )}
      </CardContent>
    </Card>
  );
}
