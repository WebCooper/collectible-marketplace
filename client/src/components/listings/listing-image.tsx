"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

/**
 * Listing photos are arbitrary URLs supplied by sellers (cloud storage), so a
 * plain <img> with a local fallback is used rather than next/image, which
 * would need every storage host allow-listed in next.config.ts.
 */
export function ListingImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={usable ? src : PLACEHOLDER_IMAGE}
      alt={alt}
      loading="lazy"
      onError={() => src && setFailedSrc(src)}
      className={cn(!usable && "object-contain p-10 opacity-60", className)}
    />
  );
}
