"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "react-hot-toast";
import type { AuthUser } from "@/lib/auth";

interface ApiResult {
  success?: boolean;
  message?: string;
  error?: string;
  user?: AuthUser;
}

async function api<T = ApiResult>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return data;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** identifier is an email address OR a phone number. */
  login: (identifier: string, password: string, bot?: string) => Promise<string | null>;
  register: (name: string, phone: string, email: string, password: string, bot?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<string | null>;
  resendVerification: (email: string) => Promise<string | null>;
  forgotPassword: (email: string, bot?: string) => Promise<string | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
  refreshUser: () => Promise<void>;
  updateAuthUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api<ApiResult>("/api/auth/me");
      if (data.success && data.user) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    api<ApiResult>("/api/auth/me")
      .then((data) => ({ user: data.success && data.user ? data.user : null }))
      .then(({ user }) => {
        setUser(user);
        lastRoleRef.current = user?.role ?? null;
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        lastRoleRef.current = null;
        setLoading(false);
      });
  }, []);

  // Keep the session fresh: when the clinic promotes or demotes a user, the
  // next time they return to the tab we pick up the new role. If the role
  // actually changed we reload so every view switches over cleanly.
  const lastRoleRef = useRef<AuthUser["role"] | null>(null);
  useEffect(() => {
    if (loading) return;
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await api<ApiResult>("/api/auth/me");
        const next = data.success && data.user ? data.user : null;
        const nextRole = next?.role ?? null;
        if (next && lastRoleRef.current !== null && next.role !== lastRoleRef.current) {
          window.location.reload();
          return;
        }
        if (next) setUser(next);
        lastRoleRef.current = nextRole;
      } catch {
        /* transient network issue - keep the current session */
      }
    };
    const onFocus = () => {
      void sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loading]);

  const login = useCallback(async (identifier: string, password: string, bot?: string) => {
    try {
      const data = await api<ApiResult>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password, website: bot }),
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success(data.message || "Signed in successfully.");
        return null;
      }
      return data.error || "Sign-in failed. Please try again.";
    } catch {
      return "Sign-in failed. Please try again.";
    }
  }, []);

  const register = useCallback(
    async (name: string, phone: string, email: string, password: string, bot?: string) => {
      try {
        const data = await api<ApiResult & { warning?: string }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, phone, email, password, website: bot }),
        });
        if (data.success) {
          toast.success(data.message || "Account created. Please verify your email.");
          if (data.warning) toast(data.warning, { icon: "⚠️", duration: 8000 });
          return null;
        }
        return data.error || "Registration failed. Please try again.";
      } catch {
        return "Registration failed. Please try again.";
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      toast.success("Signed out.");
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const data = await api<ApiResult>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (data.success) {
        toast.success(data.message || "Email verified.");
        await refreshUser();
        return null;
      }
      return data.error || "Could not verify your email.";
    } catch {
      return "Could not verify your email. Please try again.";
    }
  }, [refreshUser]);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const data = await api<ApiResult>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return data.error || null;
    } catch {
      return "Could not resend the verification link. Please try again.";
    }
  }, []);

  const forgotPassword = useCallback(async (email: string, bot?: string) => {
    try {
      const data = await api<ApiResult>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, website: bot }),
      });
      return data.error || null;
    } catch {
      return "Could not send a password reset link. Please try again.";
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      const data = await api<ApiResult>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      if (data.success) {
        toast.success(data.message || "Password reset successfully.");
        return null;
      }
      return data.error || "Could not reset your password.";
    } catch {
      return "Could not reset your password. Please try again.";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        refreshUser,
        updateAuthUser: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}