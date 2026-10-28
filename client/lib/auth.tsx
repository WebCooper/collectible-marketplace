"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError, SESSION_EXPIRED_EVENT } from "./api";
import type { Profile } from "./types";

interface AuthState {
  user: Profile | null;
  /** True until the first session probe finishes. */
  loading: boolean;
  /** Re-read the profile, e.g. after sign-in or a profile edit. */
  reload: () => Promise<Profile | null>;
  logout: () => Promise<void>;
  setUser: (user: Profile | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      api.users
        .me()
        .then(
          (profile) => {
            setUser(profile);
            return profile;
          },
          (err) => {
            if (!(err instanceof ApiError) || err.status === 401) setUser(null);
            return null;
          },
        )
        .finally(() => setLoading(false)),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void reload();
    const expired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  }, [reload]);

  const value = useMemo(
    () => ({ user, loading, reload, logout, setUser }),
    [user, loading, reload, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
