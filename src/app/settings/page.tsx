"use client";

import { useState, useEffect } from "react";
import { Settings, Globe, Clock, Check } from "lucide-react";
import { useSettings, COMMON_TIMEZONES } from "@/lib/settings-context";
import { useT } from "@/lib/i18n";

export default function SettingsPage() {
  const { timezone, language, setTimezone, setLanguage } = useSettings();
  const t = useT();

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">{t("settings.page_title")}</h1>
      </div>

      <div className="space-y-6">
        {/* 언어 설정 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">{t("settings.language")}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.language_desc")}
          </p>
          <div className="flex gap-3">
            <LanguageOption
              selected={language === "en"}
              onClick={() => setLanguage("en")}
              label={t("settings.language_en")}
              description={t("settings.language_en_desc")}
            />
            <LanguageOption
              selected={language === "local"}
              onClick={() => setLanguage("local")}
              label={t("settings.language_local")}
              description={t("settings.language_local_desc")}
            />
          </div>
        </section>

        {/* 타임존 설정 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">{t("settings.timezone")}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.timezone_desc")}
          </p>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {COMMON_TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <CurrentTime timezone={timezone} currentTimeLabel={t("settings.current_time")} />
        </section>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        {t("settings.auto_save")}
      </p>
    </div>
  );
}

function LanguageOption({
  selected, onClick, label, description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
        selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
      }`}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <div>
        <p className={`text-sm font-medium ${selected ? "text-blue-700" : "text-gray-700"}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function CurrentTime({ timezone, currentTimeLabel }: { timezone: string; currentTimeLabel: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("ko-KR", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <p className="text-xs text-gray-500 mt-2">
      {currentTimeLabel} <span className="font-mono text-gray-700">{time}</span>
    </p>
  );
}
