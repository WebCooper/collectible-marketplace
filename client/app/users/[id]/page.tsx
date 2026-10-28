"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ListingCard, ListingGridSkeleton } from "@/components/ListingCard";
import { ReportButton } from "@/components/ReportButton";
import { Avatar, EmptyState, PageLoader, Pagination } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { date, humanize } from "@/lib/format";
import type { ListingCard as Card, Page, PublicProfile } from "@/lib/types";

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Page<Card> | null>(null);

  useEffect(() => {
    api.users.publicProfile(id).then(setProfile).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    api.listings.search({ sellerId: id, page, limit: 12 }).then(setListings).catch(() => {});
  }, [id, page]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title="Profile not found" action={<Link href="/listings" className="btn btn-primary">Browse collectibles</Link>} />
      </div>
    );
  }
  if (!profile) return <PageLoader />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up card relative mb-10 overflow-hidden p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-emerald-50 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Avatar name={profile.name} url={profile.avatarUrl} size="size-20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500">{humanize(profile.role)} · Member since {date(profile.createdAt)}</p>
            {profile.bio && <p className="mt-3 max-w-2xl text-slate-600">{profile.bio}</p>}
          </div>
          <div className="flex gap-3">
            <Stat label="Active listings" value={profile.activeListings} />
            <Stat label="Completed sales" value={profile.completedSales} />
          </div>
        </div>
        {user && user.id !== profile.id && (
          <div className="relative mt-4 flex justify-end">
            <ReportButton target="USER" id={profile.id} label="Report user" />
          </div>
        )}
      </div>

      <h2 className="mb-6 text-xl font-semibold text-slate-900">Listings by {profile.name.split(" ")[0]}</h2>
      {!listings ? (
        <ListingGridSkeleton count={4} />
      ) : listings.data.length === 0 ? (
        <EmptyState title="No listings right now" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.data.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
          </div>
          <Pagination page={listings.meta.page} totalPages={listings.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-5 py-3 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
