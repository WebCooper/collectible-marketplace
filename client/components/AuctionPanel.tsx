"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { countdown, dateTime, money, timeAgo } from "@/lib/format";
import {
  auctionSocket,
  type BidEvent,
  type ClosedEvent,
  type ExtendedEvent,
} from "@/lib/socket";
import { useToast } from "@/lib/toast";
import type { Auction, Bid } from "@/lib/types";
import { useNow } from "./ListingCard";
import { ErrorText, Modal, Spinner } from "./ui";

export function AuctionPanel({
  initial,
  sellerId,
  hasOrder,
  onClosed,
}: {
  initial: Auction;
  sellerId: string;
  hasOrder: boolean;
  onClosed: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const now = useNow();
  const [auction, setAuction] = useState(initial);
  const [bids, setBids] = useState<Bid[]>([]);
  const [live, setLive] = useState(false);
  const [draft, setDraft] = useState<{ min: number; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmBuyNow, setConfirmBuyNow] = useState(false);

  const id = initial.id;

  const resync = useCallback(
    () =>
      Promise.all([api.auctions.get(id), api.auctions.bids(id, 1, 10)]).then(
        ([fresh, history]) => {
          setAuction(fresh);
          setBids(history.data);
        },
        () => {
          /* keep the last known state */
        },
      ),
    [id],
  );

  // Live updates: subscribe, and re-sync on every (re)connect because missed
  // events are not replayed.
  useEffect(() => {
    const socket = auctionSocket();
    const subscribe = () => {
      socket.emit("auction:subscribe", { auctionId: id }, () => setLive(true));
      void resync();
    };
    const onBid = (e: BidEvent) => {
      if (e.auctionId !== id) return;
      setAuction((a) => ({ ...a, currentPrice: e.currentPrice, bidCount: e.bidCount, endTime: e.endTime }));
      setBids((b) => [
        { id: `live-${e.placedAt}`, amount: e.currentPrice, status: "ACTIVE" as const, placedAt: e.placedAt, bidder: e.bidder },
        ...b.map((x) => (x.status === "ACTIVE" ? { ...x, status: "OUTBID" as const } : x)),
      ].slice(0, 10));
    };
    const onExtended = (e: ExtendedEvent) => {
      if (e.auctionId !== id) return;
      setAuction((a) => ({ ...a, endTime: e.endTime }));
      toast("A late bid extended this auction by 2 minutes.", "info");
    };
    const onClosedEvt = (e: ClosedEvent) => {
      if (e.auctionId !== id) return;
      setAuction((a) => ({ ...a, status: "ENDED", currentPrice: e.finalPrice, winnerId: e.winner?.id ?? null }));
      onClosed();
    };
    const onDisconnect = () => setLive(false);

    socket.on("connect", subscribe);
    socket.on("disconnect", onDisconnect);
    socket.on("auction:bid", onBid);
    socket.on("auction:extended", onExtended);
    socket.on("auction:closed", onClosedEvt);
    if (socket.connected) subscribe();
    else void resync();

    return () => {
      socket.emit("auction:unsubscribe", { auctionId: id });
      socket.off("connect", subscribe);
      socket.off("disconnect", onDisconnect);
      socket.off("auction:bid", onBid);
      socket.off("auction:extended", onExtended);
      socket.off("auction:closed", onClosedEvt);
    };
  }, [id, resync, toast, onClosed]);

  const minBid =
    auction.bidCount === 0
      ? Number(auction.startPrice)
      : Number(auction.currentPrice) + Number(auction.minIncrement);

  // The typed amount only applies while the minimum is unchanged; a new bid
  // resets the field to the new minimum.
  const amount = draft && draft.min === minBid ? draft.value : String(minBid);
  const setAmount = (value: string) => setDraft({ min: minBid, value });

  const remaining = new Date(auction.endTime).getTime() - now;
  const startsIn = new Date(auction.startTime).getTime() - now;
  const isOpen = auction.status === "ACTIVE" && remaining > 0;
  const isOwner = user?.id === sellerId;
  const isWinner = !!user && auction.winnerId === user.id;
  const topBidder = bids[0]?.bidder.id === user?.id && auction.bidCount > 0;
  const canBuyNow =
    isOpen && !!auction.buyNowPrice && Number(auction.currentPrice) < Number(auction.buyNowPrice);

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setBusy(true);
    setError("");
    try {
      await api.auctions.placeBid(id, Number(amount));
      toast(`Bid of ${money(amount)} placed — you're the top bidder!`);
      await resync();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function buyNow() {
    setBusy(true);
    setError("");
    try {
      await api.auctions.buyNow(id);
      toast("It's yours! Complete checkout to arrange delivery.");
      router.push(`/checkout?auctionId=${id}`);
    } catch (err) {
      setError((err as Error).message);
      setConfirmBuyNow(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50/70 to-white p-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium tracking-wide text-slate-500 uppercase">
            {auction.bidCount ? "Current bid" : "Opening bid"}
          </span>
          <span className={`flex items-center gap-1.5 ${live ? "text-emerald-700" : "text-slate-400"}`}>
            <span className={`size-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-300"}`} />
            {live ? "Live" : "Connecting"}
          </span>
        </div>
        <p key={auction.currentPrice} className="animate-pop -mx-1 mt-1 inline-block rounded-lg px-1 text-4xl font-semibold tracking-tight text-slate-900">
          {money(auction.bidCount ? auction.currentPrice : auction.startPrice)}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Bids" value={String(auction.bidCount)} />
          <Stat
            label={auction.status === "SCHEDULED" ? "Starts in" : "Time left"}
            value={auction.status === "SCHEDULED" ? countdown(startsIn) : isOpen ? countdown(remaining) : "Ended"}
            urgent={isOpen && remaining < 5 * 60_000}
          />
          <Stat label="Increment" value={money(auction.minIncrement)} />
        </div>
        {auction.extensionCount > 0 && isOpen && (
          <p className="mt-3 text-xs text-amber-700">Extended {auction.extensionCount}× by late bids</p>
        )}
      </div>

      <div className="space-y-4 p-6">
        {auction.status === "SCHEDULED" && (
          <p className="text-sm text-slate-600">Bidding opens {dateTime(auction.startTime)}.</p>
        )}

        {isOpen && isOwner && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">This is your auction — you can watch bids arrive live.</p>
        )}

        {isOpen && !isOwner && (
          <>
            <form onSubmit={placeBid} className="space-y-2">
              <label className="label" htmlFor="bid">Your bid (min {money(minBid)})</label>
              <div className="flex gap-2">
                <input
                  id="bid"
                  type="number"
                  className="input text-base"
                  min={minBid}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <button className="btn btn-primary shrink-0 px-6" disabled={busy || topBidder}>
                  {busy && <Spinner className="size-4" />} Place bid
                </button>
              </div>
              {topBidder && <p className="text-sm font-medium text-emerald-700">You&apos;re the top bidder 🎉</p>}
            </form>
            {canBuyNow && (
              <button className="btn btn-accent w-full" disabled={busy} onClick={() => (user ? setConfirmBuyNow(true) : router.push("/login"))}>
                Buy it now for {money(auction.buyNowPrice)}
              </button>
            )}
          </>
        )}

        {!isOpen && auction.status !== "SCHEDULED" && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            {auction.winnerId ? (
              isWinner ? (
                <div className="space-y-3">
                  <p className="font-medium text-emerald-800">🎉 You won this auction for {money(auction.currentPrice)}.</p>
                  {hasOrder ? (
                    <Link href="/orders" className="btn btn-outline w-full">View your order</Link>
                  ) : (
                    <Link href={`/checkout?auctionId=${id}`} className="btn btn-primary w-full">Proceed to checkout</Link>
                  )}
                </div>
              ) : (
                <p className="text-slate-600">
                  Sold for <span className="font-semibold text-slate-900">{money(auction.currentPrice)}</span>
                  {auction.winner ? ` to ${auction.winner.name}` : ""}.
                </p>
              )
            ) : (
              <p className="text-slate-600">This auction closed without a winning bid.</p>
            )}
          </div>
        )}

        <ErrorText>{error}</ErrorText>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Bid history</h3>
          {bids.length === 0 ? (
            <p className="text-sm text-slate-400">No bids yet — be the first.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bids.map((b, i) => (
                <li key={b.id} className={`flex items-center justify-between py-2 text-sm ${i === 0 ? "animate-fade-up" : ""}`}>
                  <span className={b.bidder.id === user?.id ? "font-medium text-emerald-700" : "text-slate-600"}>
                    {b.bidder.id === user?.id ? "You" : b.bidder.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{timeAgo(b.placedAt)}</span>
                    <span className={`font-medium ${i === 0 ? "text-slate-900" : "text-slate-500"}`}>{money(b.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={confirmBuyNow} onClose={() => setConfirmBuyNow(false)} title="Confirm Buy Now">
        <p className="text-sm text-slate-600">
          This ends the auction immediately and you commit to buy the item for{" "}
          <span className="font-semibold text-slate-900">{money(auction.buyNowPrice)}</span>.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={() => setConfirmBuyNow(false)}>Cancel</button>
          <button className="btn btn-accent" disabled={busy} onClick={buyNow}>
            {busy && <Spinner className="size-4" />} Buy now
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2.5 ring-1 ring-slate-100">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${urgent ? "animate-pulse text-rose-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
