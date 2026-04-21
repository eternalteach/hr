"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
    window.location.href = "/login";
  };

  // 로딩 중(currentUser null)에는 쓰기 버튼을 노출하지 않는다.
  // admin/leader → false, member → true, 미확인 → true
  const isReadOnly = !currentUser || currentUser.role === "member";

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
