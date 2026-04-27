import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (input: {
    username: string;
    password: string;
    displayName?: string;
    avatar?: string;
  }) => Promise<void>;
  login: (input: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    displayName?: string;
    avatar?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    body,
    headers,
    credentials: "same-origin",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && (data as any).error) ||
      `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ user: AuthUser | null }>("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback<AuthContextValue["signup"]>(async (input) => {
    const res = await apiFetch<{ user: AuthUser }>("/auth/signup", {
      method: "POST",
      json: input,
    });
    setUser(res.user);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (input) => {
    const res = await apiFetch<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      json: input,
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (input) => {
      const res = await apiFetch<{ user: AuthUser }>("/auth/me", {
        method: "PUT",
        json: input,
      });
      setUser(res.user);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signup, login, logout, updateProfile }),
    [user, loading, signup, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
