"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { EmptyState, ErrorText, Pagination } from "@/components/ui";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/format";
import type { ListingFilters } from "@/lib/types";
import { useRequest } from "@/lib/useRequest";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "ending_soonest", label: "Ending soonest" },
  { value: "popularity", label: "Most viewed" },
];

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ListingGridSkeleton /></div>}>
      <Browse />
    </Suspense>
  );
}

function Browse() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const get = (k: string) => params.get(k) ?? "";
  const filters: ListingFilters = {
    q: get("q") || undefined,
    category: (get("category") || undefined) as ListingFilters["category"],
    condition: (get("condition") || undefined) as ListingFilters["condition"],
    listingType: (get("listingType") || undefined) as ListingFilters["listingType"],
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    verifiedOnly: get("verifiedOnly") === "true" || undefined,
    featuredOnly: get("featuredOnly") === "true" || undefined,
    sort: (get("sort") || "newest") as ListingFilters["sort"],
    page: Number(get("page") || 1),
    limit: 12,
  };
  const { data: result, error } = useRequest(params.toString(), () => api.listings.search(filters));

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in changes)) next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const activeCount = ["category", "condition", "listingType", "minPrice", "maxPrice", "verifiedOnly", "featuredOnly"].filter(
    (k) => params.get(k),
  ).length;

  const sidebar = (
    <div className="space-y-6">
      <FilterGroup title="Category">
        <Radio name="category" label="All categories" checked={!filters.category} onChange={() => update({ category: undefined })} />
        {CATEGORIES.map((c) => (
          <Radio
            key={c.value}
            name="category"
            label={c.label}
            checked={filters.category === c.value}
            onChange={() => update({ category: c.value })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Format">
        {[
          [undefined, "All formats"],
          ["AUCTION", "Auction"],
          ["FIXED_PRICE", "Buy now"],
        ].map(([v, label]) => (
          <Radio key={label} name="type" label={label!} checked={filters.listingType === v} onChange={() => update({ listingType: v })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Condition">
        <select
          className="input"
          value={filters.condition ?? ""}
          onChange={(e) => update({ condition: e.target.value || undefined })}
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup title="Price (LKR)">
        <PriceRange
          key={`${get("minPrice")}-${get("maxPrice")}`}
          min={get("minPrice")}
          max={get("maxPrice")}
          onApply={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
        />
      </FilterGroup>
      <FilterGroup title="Trust">
        <Check label="Verified only" checked={!!filters.verifiedOnly} onChange={(v) => update({ verifiedOnly: v ? "true" : undefined })} />
        <Check label="Rare & featured" checked={!!filters.featuredOnly} onChange={(v) => update({ featuredOnly: v ? "true" : undefined })} />
      </FilterGroup>
      {activeCount > 0 && (
        <button
          className="btn btn-ghost w-full"
          onClick={() => router.push(filters.q ? `${pathname}?q=${encodeURIComponent(filters.q)}` : pathname)}
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {filters.q ? `Results for “${filters.q}”` : "Browse collectibles"}
          </h1>
          <p className="mt-1 text-slate-500">
            {result ? `${result.meta.total} item${result.meta.total === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline lg:hidden" onClick={() => setFiltersOpen((o) => !o)}>
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
          <select
            className="input w-auto"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            aria-label="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? "animate-fade-in block" : "hidden"} lg:block`}>{sidebar}</aside>
        <div>
          <ErrorText>{error}</ErrorText>
          {!result && !error ? (
            <ListingGridSkeleton count={6} />
          ) : result && result.data.length === 0 ? (
            <EmptyState title="No collectibles match" text="Try removing a filter or searching for something broader." />
          ) : result ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.data.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
              <Pagination
                page={result.meta.page}
                totalPages={result.meta.totalPages}
                onChange={(p) => {
                  update({ page: String(p) });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 ${checked ? "font-medium text-emerald-800" : "text-slate-600"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-emerald-700" />
      {label}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-700" />
      {label}
    </label>
  );
}

function PriceRange({ min, max, onApply }: { min: string; max: string; onApply: (min?: string, max?: string) => void }) {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(lo || undefined, hi || undefined);
      }}
    >
      <input className="input px-2" type="number" min={0} placeholder="Min" value={lo} onChange={(e) => setLo(e.target.value)} />
      <input className="input px-2" type="number" min={0} placeholder="Max" value={hi} onChange={(e) => setHi(e.target.value)} />
      <button className="btn btn-outline px-3">Go</button>
    </form>
  );
}
