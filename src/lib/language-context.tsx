"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface LanguageContextValue {
  /** true면 영문 컬럼도 함께 표시, false면 local만 표시 (기본값) */
  showEnglish: boolean;
  toggle: () => void;
  setShowEnglish: (v: boolean) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "taskflow.showEnglish";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [showEnglish, setShowEnglish] = useState(false);

  // 마운트 시 localStorage에서 복원 — SSR 안전을 위해 effect에서만 읽는다
  // (useState 지연 초기화는 서버/클라이언트 hydration mismatch를 유발)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setShowEnglish(true);
  }, []);

  // 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showEnglish));
  }, [showEnglish]);

  return (
    <LanguageContext.Provider value={{ showEnglish, toggle: () => setShowEnglish(v => !v), setShowEnglish }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
