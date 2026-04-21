"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Member } from "@/lib/types";

interface AuthContextValue {
  currentUser: Member | null;
  members: Member[];
  /** role이 "member"(팀원)이면 true — 쓰기 작업 비활성화 */
  isReadOnly: boolean;
  setCurrentUserId: (id: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "taskflow.currentUserId";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/members")
      .then(r => r.json())
      .then((data: Member[]) => {
        setMembers(data);
        const stored = localStorage.getItem(STORAGE_KEY);
        const storedId = stored ? Number(stored) : null;
        if (storedId && data.some(m => m.id === storedId)) {
          setCurrentUserIdState(storedId);
        } else {
          const defaultUser = data.find(m => m.role === "admin") ?? data[0] ?? null;
          if (defaultUser) {
            setCurrentUserIdState(defaultUser.id);
            localStorage.setItem(STORAGE_KEY, String(defaultUser.id));
          }
        }
      });
  }, []);

  const setCurrentUserId = (id: number) => {
    setCurrentUserIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const currentUser = members.find(m => m.id === currentUserId) ?? null;
  const isReadOnly = currentUser?.role === "member";

  return (
    <AuthContext.Provider value={{ currentUser, members, isReadOnly, setCurrentUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
