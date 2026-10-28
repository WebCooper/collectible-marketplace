"use client";

import { useEffect, useState } from "react";

/**
 * Runs `fetcher` whenever `key` changes. While a new key is loading, `data`
 * is null; responses for an outdated key are dropped.
 */
export function useRequest<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<{ key: string; data?: T; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetcher().then(
      (data) => !cancelled && setState({ key, data }),
      (err: Error) => !cancelled && setState({ key, error: err.message }),
    );
    return () => {
      cancelled = true;
    };
    // The key describes everything the fetcher depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state?.key === key ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? "" };
}
