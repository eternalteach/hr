"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";

interface AuthContextValue {
  currentUser: Member | null;
  isLoading: boolean;
  /** role이 "member"(팀원)이면 true — 쓰기 작업 비활성화 */
  isReadOnly: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        setCurrentUser(await res.json() as Member);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  const isReadOnly = currentUser?.role === "member";

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, isReadOnly, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
