"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface QueryState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

/**
 * Minimal client-side fetching for API calls.
 *
 * `key` identifies the request: whenever it changes the data is fetched
 * again, and `null` skips fetching. Responses that arrive after the key has
 * changed are ignored. `reload()` re-fetches while keeping the current data
 * on screen.
 */
export function useApiQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    error: undefined,
    loading: key !== null,
  });
  const [version, setVersion] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null) return;
    let current = true;

    // Kick off the request; state updates happen in the async callbacks.
    Promise.resolve()
      .then(() => {
        if (current) setState((s) => ({ ...s, loading: true, error: undefined }));
        return fetcherRef.current();
      })
      .then(
        (data) => {
          if (current) setState({ data, error: undefined, loading: false });
        },
        (error: unknown) => {
          if (current) setState((s) => ({ ...s, error, loading: false }));
        },
      );

    return () => {
      current = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
