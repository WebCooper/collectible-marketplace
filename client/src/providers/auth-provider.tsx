"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  authApi,
  usersApi,
  type Session,
  type SessionUser,
} from "@/lib/api";

/**
 * Session state for the whole app.
 *
 * The API keeps the session in httpOnly cookies that page scripts cannot
 * read, so the client learns who is signed in by calling GET /users/me.
 * A localStorage flag remembers that this browser has signed in before, so
 * guests are not sent through a pointless 401 -> refresh -> 401 round-trip on
 * every page view. The flag holds no secret; the cookies remain the source of
 * truth.
 */

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** Signs in with e-mail and password. Throws ApiError on failure. */
  signIn: (email: string, password: string) => Promise<SessionUser>;
  /** Clears the session cookies and local state. */
  signOut: () => Promise<void>;
  /** Adopts a session returned by verify-otp (or any other session response). */
  acceptSession: (session: Session) => void;
  /** Re-reads the signed-in user from the API. */
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_HINT_KEY = "lankanumis.has-session";

const sessionHint = {
  has() {
    try {
      return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
    } catch {
      return true; // storage blocked: fall back to asking the API
    }
  },
  set() {
    try {
      window.localStorage.setItem(SESSION_HINT_KEY, "1");
    } catch {
      /* storage unavailable - harmless */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      /* storage unavailable - harmless */
    }
  },
};

function toSessionUser(user: SessionUser): SessionUser {
  const { id, name, email, role, status, avatarUrl } = user;
  return { id, name, email, role, status, avatarUrl };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const becomeGuest = useCallback(() => {
    sessionHint.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  const acceptSession = useCallback((session: Session) => {
    sessionHint.set();
    setUser(toSessionUser(session.user));
    setStatus("authenticated");
  }, []);

  const reload = useCallback(async () => {
    if (!sessionHint.has()) {
      setUser(null);
      setStatus("guest");
      return;
    }
    try {
      const profile = await usersApi.me();
      setUser(toSessionUser(profile));
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        becomeGuest();
      } else {
        // API unreachable or failing: show the guest UI but keep the hint so
        // the session is picked up again once the API is back.
        setUser(null);
        setStatus("guest");
      }
    }
  }, [becomeGuest]);

  // Restore the session on first load.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the external session cookie
    void reload();
  }, [reload]);

  // The HTTP layer fires this when a 401 could not be fixed by refreshing.
  useEffect(() => {
    const onExpired = () => {
      setStatus((current) => {
        if (current === "authenticated") {
          sessionHint.clear();
          setUser(null);
          return "guest";
        }
        return current;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Keep tabs in sync when the user signs in or out elsewhere.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_HINT_KEY) void reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login({ email, password });
      acceptSession(session);
      return toSessionUser(session.user);
    },
    [acceptSession],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      becomeGuest();
    }
  }, [becomeGuest]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signOut, acceptSession, reload }),
    [user, status, signIn, signOut, acceptSession, reload],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
