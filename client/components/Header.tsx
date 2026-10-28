"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./ui";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
      <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-sm text-amber-950 shadow-sm">
        ₨
      </span>
      <span className="hidden sm:inline">
        Ceylon<span className="text-emerald-700">Collect</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Poll the unread badge while signed in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () =>
      api.notifications
        .unreadCount()
        .then((r) => !cancelled && setUnread(r.count))
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN";

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        pathname.startsWith(href)
          ? "text-emerald-700"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center md:flex">
          {navLink("/listings", "Browse")}
          {isSeller && navLink("/sell", "Sell")}
        </nav>

        <form
          className="ml-auto flex max-w-md flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/listings${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search coins, notes, stamps…"
            className="input rounded-full bg-slate-50 px-4 py-2"
            aria-label="Search listings"
          />
        </form>

        {user ? (
          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && (
                <span className="animate-fade-in absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                <Avatar name={user.name} url={user.avatarUrl} size="size-8" />
              </button>
              {menuOpen && (
                <div className="animate-fade-up absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  {[
                    ["/listings", "Browse", true],
                    ["/bids", "My bids", true],
                    ["/orders", "Orders", true],
                    ["/sell", "Seller dashboard", isSeller],
                    ["/account", "Account settings", true],
                  ]
                    .filter(([, , show]) => show)
                    .map(([href, label]) => (
                      <Link
                        key={href as string}
                        href={href as string}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                      >
                        {label}
                      </Link>
                    ))}
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      router.push("/");
                    }}
                    className="block w-full border-t border-slate-100 px-4 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary">
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-100 bg-slate-50/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:px-6">
        <Logo />
        <p>Sri Lanka&apos;s marketplace for verified coins, notes, stamps and medals.</p>
        <div className="flex gap-4">
          <Link href="/listings" className="hover:text-emerald-700">Browse</Link>
          <Link href="/register" className="hover:text-emerald-700">Start selling</Link>
        </div>
      </div>
    </footer>
  );
}
