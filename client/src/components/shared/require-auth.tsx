"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { loginHref } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

/**
 * Shows its children only to a signed-in user (optionally with one of `roles`).
 * Guests are sent to /login and returned here afterwards. This is a UX guard;
 * the API enforces the same rules on every request.
 */
export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") router.replace(loginHref(pathname));
  }, [status, router, pathname]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16" aria-busy>
        <div className="h-8 w-56 rounded bg-surface animate-pulse" />
      </div>
    );
  }

  if (roles && !roles.includes(user.role) && user.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Alert variant="error">
          This area is for {roles.map((r) => r.toLowerCase()).join(" / ")} accounts. You are signed in as a{" "}
          {user.role.toLowerCase()}.
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
