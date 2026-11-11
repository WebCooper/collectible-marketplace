"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  listingsApi,
  type CreateListingRequest,
  type ListingDetail,
  type UpdateListingRequest,
} from "@/lib/api";
import { CATEGORIES, CONDITION_LABELS } from "@/lib/constants";
import {
  certificateSchema,
  listingSchema,
  type CertificateFormInput,
  type ListingFormInput,
} from "@/lib/validations/listing-schema";
import { apiFormErrors, zodFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Field = keyof ListingFormInput | "certificates";

const FIELD_MAP: Record<string, Field> = {
  title: "title",
  description: "description",
  category: "category",
  condition: "condition",
  era: "era",
  denomination: "denomination",
  startingPrice: "startingPrice",
  listingType: "listingType",
  images: "images",
  certificates: "certificates",
};

const EMPTY_CERT: CertificateFormInput = { fileUrl: "", fileName: "", issuer: "" };

/**
 * Create (POST /listings) or edit (PATCH /listings/:id) a listing. Every
 * create or edit sends the listing through appraiser review again; editing is
 * refused by the API once bidding has started.
 */
export function ListingForm({
  listing,
  onSaved,
}: {
  /** Present when editing. */
  listing?: ListingDetail;
  onSaved?: (listing: ListingDetail) => void;
}) {
  const router = useRouter();
  const editing = Boolean(listing);
  const [values, setValues] = useState<ListingFormInput>({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    category: listing?.category ?? "OLD_COINS",
    condition: listing?.condition ?? "GOOD",
    era: listing?.era ?? "",
    denomination: listing?.denomination ?? "",
    startingPrice: listing ? String(Number(listing.startingPrice)) : "",
    listingType: listing?.listingType ?? "FIXED_PRICE",
    images: listing?.images.length ? listing.images.map((i) => i.url) : [""],
  });
  const [certs, setCerts] = useState<CertificateFormInput[]>([]);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof ListingFormInput>(key: K, value: ListingFormInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaved(false);

    const parsed = listingSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors<Field>(parsed.error));
      return;
    }
    const imageUrls = parsed.data.images.filter(Boolean);
    const badImage = imageUrls.find((url) => !URL.canParse(url));
    if (badImage) {
      setErrors({ images: `"${badImage}" is not a valid URL` });
      return;
    }
    const filledCerts = certs.filter((c) => c.fileUrl || c.fileName || c.issuer);
    for (const cert of filledCerts) {
      const result = certificateSchema.safeParse(cert);
      if (!result.success) {
        setErrors({ certificates: result.error.issues[0]?.message });
        return;
      }
    }

    const base = {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      condition: parsed.data.condition,
      era: parsed.data.era || undefined,
      denomination: parsed.data.denomination || undefined,
      startingPrice: Number(parsed.data.startingPrice),
      listingType: parsed.data.listingType,
      images: imageUrls.map((url, position) => ({ url, position })),
    };

    setSubmitting(true);
    try {
      if (listing) {
        const body: UpdateListingRequest = base;
        const updated = await listingsApi.update(listing.id, body);
        setSaved(true);
        onSaved?.(updated);
      } else {
        const body: CreateListingRequest = {
          ...base,
          certificates: filledCerts.map((c) => ({
            fileUrl: c.fileUrl.trim(),
            fileName: c.fileName.trim(),
            issuer: c.issuer.trim() || undefined,
          })),
        };
        const created = await listingsApi.create(body);
        router.push(`/seller/listings/${created.id}?created=1`);
      }
    } catch (error) {
      const mapped = apiFormErrors<Field>(error, FIELD_MAP);
      setErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      {saved && (
        <Alert variant="success">Changes saved. The listing is back in review before it goes live again.</Alert>
      )}

      <div>
        <Label htmlFor="title" required>Title</Label>
        <Input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} error={errors.title} placeholder="1957 Ceylon 5 Rupee Commemorative Coin" />
      </div>

      <div>
        <Label htmlFor="description" required>Description</Label>
        <Textarea id="description" rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} placeholder="Provenance, strike quality, toning, any flaws…" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category" required>Category</Label>
          <Select id="category" value={values.category} onChange={(e) => set("category", e.target.value as ListingFormInput["category"])} error={errors.category}>
            {CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="condition" required>Condition</Label>
          <Select id="condition" value={values.condition} onChange={(e) => set("condition", e.target.value as ListingFormInput["condition"])} error={errors.condition}>
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="era">Era / year</Label>
          <Input id="era" value={values.era} onChange={(e) => set("era", e.target.value)} error={errors.era} placeholder="1957" />
        </div>
        <div>
          <Label htmlFor="denomination">Denomination</Label>
          <Input id="denomination" value={values.denomination} onChange={(e) => set("denomination", e.target.value)} error={errors.denomination} placeholder="5 Rupees" />
        </div>
        <div>
          <Label htmlFor="startingPrice" required>Price (LKR)</Label>
          <Input id="startingPrice" inputMode="decimal" value={values.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} error={errors.startingPrice} placeholder="18500" />
        </div>
        <div>
          <Label htmlFor="listingType" required>Sale type</Label>
          <Select id="listingType" value={values.listingType} onChange={(e) => set("listingType", e.target.value as ListingFormInput["listingType"])} error={errors.listingType}>
            <option value="FIXED_PRICE">Fixed price</option>
            <option value="AUCTION">Auction</option>
          </Select>
          {values.listingType === "AUCTION" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              After saving you will set the bidding schedule on the manage page.
            </p>
          )}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-ink">Images (links, first is the cover)</legend>
        {values.images.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              aria-label={`Image ${index + 1} URL`}
              value={url}
              placeholder="https://…/obverse.jpg"
              onChange={(e) => set("images", values.images.map((u, i) => (i === index ? e.target.value : u)))}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove image" disabled={values.images.length === 1} onClick={() => set("images", values.images.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.images && <p className="text-xs text-live">{errors.images}</p>}
        {values.images.length < 10 && (
          <Button type="button" variant="secondary" size="sm" onClick={() => set("images", [...values.images, ""])}>
            <Plus className="h-3.5 w-3.5" /> Add image
          </Button>
        )}
      </fieldset>

      {!editing && (
        <fieldset className="space-y-3">
          <legend className="text-[13px] font-medium text-ink">Authenticity certificates (optional, up to 5)</legend>
          {certs.map((cert, index) => (
            <div key={index} className="grid sm:grid-cols-[2fr_1.5fr_1.5fr_auto] gap-2">
              <Input aria-label="Certificate link" placeholder="https://…/certificate.pdf" value={cert.fileUrl} onChange={(e) => setCerts(certs.map((c, i) => (i === index ? { ...c, fileUrl: e.target.value } : c)))} />
              <Input aria-label="File name" placeholder="certificate.pdf" value={cert.fileName} onChange={(e) => setCerts(certs.map((c, i) => (i === index ? { ...c, fileName: e.target.value } : c)))} />
              <Input aria-label="Issuer" placeholder="Issuer" value={cert.issuer} onChange={(e) => setCerts(certs.map((c, i) => (i === index ? { ...c, issuer: e.target.value } : c)))} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove certificate" onClick={() => setCerts(certs.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.certificates && <p className="text-xs text-live">{errors.certificates}</p>}
          {certs.length < 5 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setCerts([...certs, { ...EMPTY_CERT }])}>
              <Plus className="h-3.5 w-3.5" /> Add certificate
            </Button>
          )}
        </fieldset>
      )}

      <Button type="submit" variant="gold" size="lg" isLoading={submitting}>
        {editing ? "Save changes" : "Submit for review"}
      </Button>
    </form>
  );
}
