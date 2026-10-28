"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { EmptyState, PageLoader } from "./ui";
import Link from "next/link";

/** Gates a page behind sign-in, and optionally behind specific roles. */
export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return <PageLoader />;

  // ADMIN may use every role-restricted route on the API.
  if (roles && user.role !== "ADMIN" && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="This area is for sellers"
          text="Your account cannot use this page. Register a seller account to list collectibles."
          action={
            <Link href="/" className="btn btn-primary">
              Back to marketplace
            </Link>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}
