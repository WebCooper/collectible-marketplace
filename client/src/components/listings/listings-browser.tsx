"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCw, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import {
  errorMessage,
  listingsApi,
  toQueryString,
  type Category,
  type ItemCondition,
  type ListingSort,
  type ListingType,
  type SearchListingsQuery,
} from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { CATEGORIES, CONDITION_LABELS, SORT_OPTIONS } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ListingCard, ListingCardSkeleton } from "./listing-card";

const PAGE_SIZE = 12;

const CATEGORY_VALUES = CATEGORIES.map((c) => c.category);
const CONDITION_VALUES = Object.keys(CONDITION_LABELS) as ItemCondition[];
const SORT_VALUES = SORT_OPTIONS.map((s) => s.value);

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Reads the filter state from the URL, ignoring anything the API would reject. */
function readQuery(params: URLSearchParams): SearchListingsQuery {
  const page = Number(params.get("page"));
  return {
    q: params.get("q")?.slice(0, 100) || undefined,
    category: pick<Category>(params.get("category"), CATEGORY_VALUES),
    condition: pick<ItemCondition>(params.get("condition"), CONDITION_VALUES),
    listingType: pick<ListingType>(params.get("listingType"), ["AUCTION", "FIXED_PRICE"]),
    sort: pick<ListingSort>(params.get("sort"), SORT_VALUES),
    verifiedOnly: params.get("verifiedOnly") === "true" || undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  };
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";

const filterHeading = "mb-2 block text-[13px] font-semibold text-ink";

/** Search, filter and sort marketplace listings (GET /listings). */
export function ListingsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = readQuery(new URLSearchParams(searchParams.toString()));
  const queryString = toQueryString(query);

  const [keyword, setKeyword] = useState(query.q ?? "");
  const [prevQ, setPrevQ] = useState(query.q);
  if (query.q !== prevQ) {
    // The URL changed underneath us (e.g. navbar search): follow it.
    setPrevQ(query.q);
    setKeyword(query.q ?? "");
  }

  const { data, error, loading, reload } = useApiQuery(`listings${queryString}`, () =>
    listingsApi.search({ ...query, limit: PAGE_SIZE }),
  );

  const update = (changes: Partial<SearchListingsQuery>) => {
    // Any filter change starts again from page 1.
    const next = { ...query, page: undefined, ...changes };
    router.replace(`${pathname}${toQueryString(next)}`, { scroll: false });
  };

  const totalPages = data?.meta.totalPages ?? 0;
  const currentPage = data?.meta.page ?? query.page ?? 1;
  const activeCategory = CATEGORIES.find((c) => c.category === query.category);

  return (
    <section className="py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-line pb-6">
          <div className="eyebrow mb-2">Marketplace Catalog</div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-serif">
            {activeCategory?.name ??
              (query.listingType === "AUCTION" ? "Live Auctions" : "Browse Ceylon Collectibles")}
          </h1>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Filters */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: keyword.trim() || undefined });
              }}
            >
              <span className={filterHeading}>Keyword</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  value={keyword}
                  maxLength={100}
                  onChange={(e) => setKeyword(e.target.value)}
                  aria-label="Keyword"
                  placeholder="Title, description, era or denomination…"
                  className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm text-ink placeholder:text-muted-foreground focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <Button type="submit" variant="gold" size="sm" className="mt-2 w-full">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2 border-t border-line pt-5 text-[13px] font-semibold text-ink">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Refine results
            </div>

            <div>
              <span className={filterHeading}>Category</span>
              <select
                aria-label="Category"
                className={selectClass}
                value={query.category ?? ""}
                onChange={(e) => update({ category: (e.target.value || undefined) as Category | undefined })}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={filterHeading}>Sale type</span>
              <select
                aria-label="Sale type"
                className={selectClass}
                value={query.listingType ?? ""}
                onChange={(e) =>
                  update({ listingType: (e.target.value || undefined) as ListingType | undefined })
                }
              >
                <option value="">Auctions &amp; fixed price</option>
                <option value="AUCTION">Auctions only</option>
                <option value="FIXED_PRICE">Fixed price only</option>
              </select>
            </div>

            <div>
              <span className={filterHeading}>Condition</span>
              <select
                aria-label="Condition"
                className={selectClass}
                value={query.condition ?? ""}
                onChange={(e) =>
                  update({ condition: (e.target.value || undefined) as ItemCondition | undefined })
                }
              >
                <option value="">Any condition</option>
                {CONDITION_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={query.verifiedOnly ?? false}
                onChange={(e) => update({ verifiedOnly: e.target.checked || undefined })}
                className="h-4 w-4 rounded border-input accent-ink"
              />
              Expert verified only
            </label>

            {queryString && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  router.replace(pathname, { scroll: false });
                }}
                className="text-sm text-ink underline underline-offset-2 hover:text-ink-soft"
              >
                Clear filters
              </button>
            )}
          </aside>

          <div className="min-w-0 space-y-8">
            {/* Results bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <p className="text-sm text-ink-soft tabular-nums">
                {data
                  ? `${data.meta.total.toLocaleString()} ${data.meta.total === 1 ? "lot" : "lots"} found`
                  : "Searching the catalog…"}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span aria-hidden>Sort by</span>
                <select
                  aria-label="Sort"
                  className={`${selectClass} w-auto`}
                  value={query.sort ?? "newest"}
                  onChange={(e) => update({ sort: e.target.value as ListingSort })}
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            {error !== undefined ? (
              <Alert variant="error" className="max-w-2xl">
                <p>{errorMessage(error, "Could not load listings.")}</p>
                <button
                  onClick={reload}
                  className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-2"
                >
                  <RotateCw className="h-3 w-3" /> Try again
                </button>
              </Alert>
            ) : loading && !data ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {Array.from({ length: 6 }, (_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.data.length === 0 ? (
              <div className="rounded-md border border-line bg-surface px-4 py-16 text-center space-y-2">
                <p className="text-lg font-semibold text-ink font-serif">No lots match these filters.</p>
                <p className="text-sm text-muted-foreground">Try a broader search or clear the filters.</p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 transition-opacity ${
                  loading ? "opacity-60" : ""
                }`}
              >
                {data?.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-4 border-t border-line pt-6"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => update({ page: currentPage - 1 })}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => update({ page: currentPage + 1 })}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
