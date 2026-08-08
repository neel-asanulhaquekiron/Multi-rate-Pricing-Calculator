import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler } from "@/lib/api";

export interface User {
  id: string;
  email: string;
}

/** "loading" until /me answers on first mount, then the user or null. */
type AuthState = { status: "loading" } | { status: "ready"; user: User | null };

interface AuthContextValue {
  loading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    // Any 401 anywhere (expired cookie mid-session) signs the user out;
    // RequireAuth then redirects to /login.
    setUnauthorizedHandler(() => {
      setState({ status: "ready", user: null });
    });
    api
      .get<{ user: User }>("/api/auth/me")
      .then(({ user }) => {
        setState({ status: "ready", user });
      })
      .catch(() => {
        setState({ status: "ready", user: null });
      });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.post<{ user: User }>("/api/auth/login", { email, password });
    setState({ status: "ready", user });
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const { user } = await api.post<{ user: User }>("/api/auth/signup", { email, password });
    setState({ status: "ready", user });
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setState({ status: "ready", user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      loading: state.status === "loading",
      user: state.status === "ready" ? state.user : null,
      login,
      signup,
      logout,
    };
  }, [state, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};
