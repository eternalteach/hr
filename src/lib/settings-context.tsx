"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AppSettings {
  /** IANA timezone string, e.g. "Asia/Seoul" */
  timezone: string;
  /** Data language: which DB column to render (_local vs _en) */
  dataLanguage: "en" | "local";
  /** Label language: which language to use for UI labels via useT() */
  labelLanguage: "en" | "local";
}

interface SettingsContextValue extends AppSettings {
  /** true when dataLanguage === "en" — backward compat for useLanguage consumers */
  showEnglish: boolean;
  /** @deprecated alias for dataLanguage — use dataLanguage directly */
  language: "en" | "local";
  setTimezone: (tz: string) => void;
  setDataLanguage: (lang: "en" | "local") => void;
  setLabelLanguage: (lang: "en" | "local") => void;
  /** @deprecated use setDataLanguage instead */
  setLanguage: (lang: "en" | "local") => void;
  /** @deprecated use setDataLanguage instead */
  toggle: () => void;
  /** @deprecated use setDataLanguage instead */
  setShowEnglish: (v: boolean) => void;
}

const DEFAULT: AppSettings = {
  timezone: "Asia/Seoul",
  dataLanguage: "en",
  labelLanguage: "local",
};

const STORAGE_KEY = "taskflow.settings";

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("taskflow.showEnglish");
      const lang = legacy === "false" ? "local" : "en";
      return { ...DEFAULT, dataLanguage: lang };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { language?: "en" | "local" };
    // Migrate old single `language` field
    if (parsed.language && !parsed.dataLanguage) {
      parsed.dataLanguage = parsed.language;
    }
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);

  useEffect(() => {
    setSettings(load());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setTimezone = (timezone: string) => setSettings(s => ({ ...s, timezone }));
  const setDataLanguage = (dataLanguage: "en" | "local") => setSettings(s => ({ ...s, dataLanguage }));
  const setLabelLanguage = (labelLanguage: "en" | "local") => setSettings(s => ({ ...s, labelLanguage }));
  const showEnglish = settings.dataLanguage === "en";

  return (
    <SettingsContext.Provider value={{
      ...settings,
      showEnglish,
      language: settings.dataLanguage,
      setTimezone,
      setDataLanguage,
      setLabelLanguage,
      setLanguage: setDataLanguage,
      toggle: () => setDataLanguage(showEnglish ? "local" : "en"),
      setShowEnglish: (v: boolean) => setDataLanguage(v ? "en" : "local"),
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

/** Backward-compat alias — existing components using useLanguage() keep working */
export function useLanguage() {
  return useSettings();
}

export const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (협정 세계시)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (한국 표준시 KST, UTC+9)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (일본 표준시 JST, UTC+9)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (중국 표준시 CST, UTC+8)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (싱가포르 표준시 SGT, UTC+8)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (인도차이나 표준시 ICT, UTC+7)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (인도 표준시 IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (걸프 표준시 GST, UTC+4)" },
  { value: "Europe/London", label: "Europe/London (영국 표준시 GMT, UTC+0/+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (중부 유럽시 CET, UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (중부 유럽시 CET, UTC+1/+2)" },
  { value: "America/New_York", label: "America/New_York (동부 표준시 EST, UTC-5/-4)" },
  { value: "America/Chicago", label: "America/Chicago (중부 표준시 CST, UTC-6/-5)" },
  { value: "America/Denver", label: "America/Denver (산악 표준시 MST, UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (태평양 표준시 PST, UTC-8/-7)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (호주 동부 표준시 AEST, UTC+10/+11)" },
];
