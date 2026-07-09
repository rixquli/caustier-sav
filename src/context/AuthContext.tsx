"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signOut as authSignOut } from "@/lib/auth-client";
import type { MeResponse } from "@/types/user";
import type { UserDisplay } from "@/types/user";

type AuthContextValue = {
  user: UserDisplay | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserDisplay | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDisplay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await authSignOut();
    setUser(null);
    window.location.href = "/login";
  }

  function refreshUser() {
    return fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => {
        const nextUser = data?.user ?? null;
        setUser(nextUser);
        return nextUser;
      });
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
