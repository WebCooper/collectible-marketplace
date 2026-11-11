import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

const VARIANTS: Record<string, Variant> = {
  ACTIVE: "gold",
  PAID: "gold",
  SHIPPED: "gold",
  COMPLETED: "gold",
  APPROVED: "gold",
  RESOLVED: "gold",
  SUCCEEDED: "gold",
  WON: "gold",
  UNDER_REVIEW: "outline",
  PENDING: "outline",
  OPEN: "outline",
  INITIATED: "outline",
  REJECTED: "cyan",
  REMOVED: "cyan",
  CANCELLED: "cyan",
  FAILED: "cyan",
  OUTBID: "cyan",
  LOST: "secondary",
  WITHDRAWN: "secondary",
  EXPIRED: "secondary",
  SOLD: "secondary",
  ENDED: "secondary",
  DRAFT: "secondary",
  REFUNDED: "secondary",
};

/** Colored pill for any backend status enum value. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "secondary"}>{status.replaceAll("_", " ")}</Badge>;
}
