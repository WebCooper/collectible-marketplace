"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Gavel, Zap, Trophy, Radio, Users } from "lucide-react";
import { auctionsApi, errorMessage, type ListingDetail } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { useLiveAuction } from "@/hooks/use-live-auction";
import { useCountdown } from "@/hooks/use-countdown";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime, formatLKR, loginHref, toAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AuctionCountdown } from "./auction-countdown";
import { CheckoutPanel } from "./checkout-panel";

const BID_HISTORY_SIZE = 10;

/**
 * Live auction for a listing: REST for state and bids, Socket.IO for the
 * running price. Bids go through POST /auctions/:id/bids, which enforces the
 * rules; this panel only pre-validates to save a round-trip.
 */
export function AuctionPanel({
  listing,
  onListingChanged,
}: {
  listing: ListingDetail;
  onListingChanged: () => void;
}) {
  const auctionId = listing.auction!.id;
  const pathname = usePathname();
  const { user, status: authStatus } = useAuth();

  const auctionQuery = useApiQuery(`auction:${auctionId}`, () => auctionsApi.get(auctionId));
  const bidsQuery = useApiQuery(`bids:${auctionId}`, () =>
    auctionsApi.bids(auctionId, { limit: BID_HISTORY_SIZE }),
  );
  const reloadAuction = auctionQuery.reload;
  const reloadBids = bidsQuery.reload;

  const auction = useLiveAuction(auctionQuery.data ?? null, {
    onEvent: reloadBids,
    // Events missed while disconnected are not replayed: re-sync.
    onReconnect: () => {
      reloadAuction();
      reloadBids();
    },
  });

  // When the socket reports the close, fetch the settled state (winner, SOLD).
  const liveStatus = auction?.status;
  const fetchedStatus = auctionQuery.data?.status;
  useEffect(() => {
    if (liveStatus === "ENDED" && fetchedStatus && fetchedStatus !== "ENDED") {
      reloadAuction();
      onListingChanged();
    }
  }, [liveStatus, fetchedStatus, reloadAuction, onListingChanged]);

  const countdown = useCountdown(auction?.endTime ?? listing.auction!.endTime);

  const [amount, setAmount] = useState("");
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [confirmBuyNow, setConfirmBuyNow] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  if (!auction) {
    return auctionQuery.error !== undefined ? (
      <Alert variant="error">{errorMessage(auctionQuery.error, "Could not load the auction.")}</Alert>
    ) : (
      <div className="h-64 rounded-2xl bg-[#0d1424]/60 animate-pulse" />
    );
  }

  const current = toAmount(auction.currentPrice);
  const increment = toAmount(auction.minIncrement);
  const buyNowPrice = auction.buyNowPrice ? toAmount(auction.buyNowPrice) : null;
  const minNextBid = auction.bidCount === 0 ? toAmount(auction.startPrice) : current + increment;
  const isOpen = auction.status === "ACTIVE" && listing.status === "ACTIVE" && !countdown.isEnded;
  // Bids only ever go up, so sorting by amount gives the true order even when
  // two bids share a timestamp (the API sorts by placedAt).
  const bidHistory = [...(bidsQuery.data?.data ?? [])].sort(
    (a, b) => toAmount(b.amount) - toAmount(a.amount),
  );
  // The leader is the latest live event if we have one, otherwise the bid the
  // API marks ACTIVE (every earlier top bid is flipped to OUTBID).
  const leaderId =
    auction.lastBid?.bidder.id ?? bidHistory.find((bid) => bid.status === "ACTIVE")?.bidder.id;
  const isTopBidder = !!user && auction.bidCount > 0 && leaderId === user.id;
  const winner = auction.winner ?? auctionQuery.data?.winner ?? null;
  const isWinner = !!user && (winner?.id === user.id || auction.winnerId === user.id);

  const bidBlocker =
    authStatus !== "authenticated" || !user
      ? null // handled by the sign-in prompt
      : user.id === listing.sellerId
        ? "This is your listing - sellers cannot bid on their own items."
        : user.role === "APPRAISER"
          ? "Appraiser accounts cannot bid."
          : null;

  const placeBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);
    const value = amount.trim() === "" ? minNextBid : Number(amount);
    if (!Number.isFinite(value) || value < minNextBid) {
      setBidError(`The next bid must be at least ${formatLKR(minNextBid)}.`);
      return;
    }
    if (Math.round(value * 100) !== value * 100) {
      setBidError("Bids can have at most 2 decimal places.");
      return;
    }

    setIsBidding(true);
    try {
      const bid = await auctionsApi.placeBid(auctionId, { amount: value });
      setBidSuccess(`Bid of ${formatLKR(bid.amount)} placed - you are the highest bidder.`);
      setAmount("");
      reloadAuction();
      reloadBids();
    } catch (error) {
      setBidError(errorMessage(error, "Your bid could not be placed."));
      reloadAuction();
    } finally {
      setIsBidding(false);
    }
  };

  const buyNow = async () => {
    setBidError(null);
    setIsBuying(true);
    try {
      await auctionsApi.buyNow(auctionId);
      setConfirmBuyNow(false);
      reloadAuction();
      reloadBids();
      onListingChanged();
    } catch (error) {
      setBidError(errorMessage(error, "Buy Now failed."));
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Price + timer */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.25)] bg-[#0d1424]/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300">
            {isOpen ? (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Live auction
              </>
            ) : auction.status === "SCHEDULED" ? (
              "Scheduled auction"
            ) : (
              "Auction closed"
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Users className="h-3.5 w-3.5" /> {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
            {auction.status === "ENDED" ? "Final price" : auction.bidCount > 0 ? "Current high bid" : "Opening price"}
          </span>
          <div className="text-4xl font-bold font-mono text-[#f1d27a]">{formatLKR(current)}</div>
          {auction.lastBid && isOpen && (
            <p className="text-[11px] text-cyan-300 mt-1">
              Latest: {auction.lastBid.bidder.name} bid {formatLKR(auction.lastBid.currentPrice)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-[#0a0f1a] p-3">
            <span className="flex items-center gap-1 text-zinc-500 font-mono">
              <Clock className="h-3.5 w-3.5" /> {auction.status === "SCHEDULED" ? "Opens" : "Time left"}
            </span>
            <span className="block mt-1 font-mono text-sm text-cyan-300">
              {auction.status === "SCHEDULED" ? (
                formatDateTime(auction.startTime)
              ) : (
                <AuctionCountdown endTime={auction.endTime} showSeconds endedLabel="Closed" />
              )}
            </span>
          </div>
          <div className="rounded-xl bg-[#0a0f1a] p-3">
            <span className="text-zinc-500 font-mono">Min. increment</span>
            <span className="block mt-1 font-mono text-sm text-zinc-200">{formatLKR(increment)}</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Closes {formatDateTime(auction.endTime)}. A bid in the final 2 minutes extends the close.
        </p>
      </div>

      {/* Bidding */}
      <div id="bid" className="scroll-mt-28 space-y-3">
        {bidError && <Alert variant="error">{bidError}</Alert>}
        {bidSuccess && <Alert variant="success">{bidSuccess}</Alert>}

        {isOpen && authStatus === "guest" && (
          <Link href={loginHref(pathname)} className="block">
            <Button variant="gold" size="lg" className="w-full text-xs uppercase tracking-wider gap-2">
              <Gavel className="h-4 w-4" /> Sign in to bid
            </Button>
          </Link>
        )}

        {isOpen && bidBlocker && <Alert variant="info">{bidBlocker}</Alert>}

        {isOpen && authStatus === "authenticated" && !bidBlocker && (
          <>
            {isTopBidder ? (
              <Alert variant="success">You are the highest bidder. We&apos;ll notify you if you are outbid.</Alert>
            ) : (
              <form onSubmit={placeBid} className="space-y-2" noValidate>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">රු</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={minNextBid}
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setBidError(null);
                      }}
                      placeholder={String(minNextBid)}
                      aria-label="Bid amount in LKR"
                      className="h-12 w-full rounded-xl border border-[rgba(201,162,39,0.3)] bg-zinc-950/60 pl-10 pr-3 font-mono text-lg text-zinc-100 focus-visible:outline-none focus-visible:border-[#c9a227]"
                    />
                  </div>
                  <Button type="submit" variant="gold" size="lg" isLoading={isBidding} className="gap-2 text-xs uppercase">
                    {!isBidding && <Gavel className="h-4 w-4" />} Bid
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2].map((steps) => {
                    const quick = minNextBid + steps * increment;
                    return (
                      <button
                        key={steps}
                        type="button"
                        onClick={() => setAmount(String(quick))}
                        className="rounded-lg border border-[rgba(201,162,39,0.25)] px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:border-[#c9a227] hover:text-[#f1d27a]"
                      >
                        {formatLKR(quick)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500">Minimum next bid: {formatLKR(minNextBid)}</p>
              </form>
            )}

            {buyNowPrice !== null && current < buyNowPrice && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3 space-y-2">
                <p className="text-xs text-cyan-200">
                  Skip the wait - buy it now for{" "}
                  <span className="font-mono font-semibold">{formatLKR(buyNowPrice)}</span>. This ends the auction.
                </p>
                {confirmBuyNow ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="cyan" size="sm" isLoading={isBuying} onClick={buyNow} className="text-xs">
                      Confirm purchase
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmBuyNow(false)} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="cyan" size="sm" onClick={() => setConfirmBuyNow(true)} className="w-full text-xs gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Buy Now
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Closed */}
        {auction.status === "ENDED" && (
          <div className="rounded-2xl border border-[rgba(201,162,39,0.25)] bg-[#0d1424]/70 p-4 space-y-3">
            <p className="flex items-center gap-2 text-sm text-white">
              <Trophy className="h-4 w-4 text-[#f1d27a]" />
              {winner ? (
                <>
                  Won by <span className="font-semibold">{isWinner ? "you" : winner.name}</span> for{" "}
                  <span className="font-mono text-[#f1d27a]">{formatLKR(current)}</span>
                </>
              ) : (
                "This auction closed without bids."
              )}
            </p>
            {isWinner &&
              (listing._count.orders > 0 ? (
                <Alert variant="info">An order has already been created for this win.</Alert>
              ) : (
                <CheckoutPanel auctionId={auctionId} />
              ))}
          </div>
        )}
      </div>

      {/* Bid history */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white font-serif">Bid history</h3>
        {bidHistory.length > 0 ? (
          <ul className="divide-y divide-white/5 rounded-xl border border-white/5 bg-[#0a0f1a]/60">
            {bidHistory.map((bid) => (
              <li key={bid.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-zinc-300">
                  {user?.id === bid.bidder.id ? "You" : bid.bidder.name}
                  {bid.status === "ACTIVE" && <span className="ml-2 text-[10px] text-cyan-400">LEADING</span>}
                  {bid.status === "WON" && <span className="ml-2 text-[10px] text-[#f1d27a]">WON</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-zinc-500">{formatDateTime(bid.placedAt)}</span>
                  <span className="font-mono text-[#f1d27a]">{formatLKR(bid.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">
            {bidsQuery.loading ? "Loading bids…" : "No bids yet - be the first."}
          </p>
        )}
      </div>
    </div>
  );
}
