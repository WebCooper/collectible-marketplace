import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Centered width container shared by the signed-in pages. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">{children}</div>;
}
