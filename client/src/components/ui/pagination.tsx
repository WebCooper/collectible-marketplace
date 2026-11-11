import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";

/** Previous / next controls for a Paginated<T> response. */
export function Pagination({
  meta,
  onPage,
}: {
  meta: PageMeta | undefined;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>
  );
}
