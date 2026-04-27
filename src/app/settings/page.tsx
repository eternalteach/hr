"use client";

import { useState, useEffect } from "react";
import { Settings, Database, Tag, Clock, Check, Globe } from "lucide-react";
import { useSettings, COMMON_TIMEZONES, LOCAL_LANGUAGES } from "@/lib/settings-context";
import { useT } from "@/lib/i18n";
import { LlmConfigSection } from "@/components/settings/LlmConfigSection";

export default function SettingsPage() {
  const { 
    timezone, dataLanguage, labelLanguage, localLanguage,
    setTimezone, setDataLanguage, setLabelLanguage, setLocalLanguage 
  } = useSettings();
  const t = useT();

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">{t("settings.page_title")}</h1>
      </div>

      <div className="space-y-6">
        {/* 데이터 언어 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">{t("settings.data_language")}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.data_language_desc")}
          </p>
          <div className="flex gap-3">
            <LangOption
              selected={dataLanguage === "en"}
              onClick={() => setDataLanguage("en")}
              label={t("settings.language_en")}
              description={t("settings.language_en_desc")}
            />
            <LangOption
              selected={dataLanguage === "local"}
              onClick={() => setDataLanguage("local")}
              label={t("settings.language_local")}
              description={t("settings.language_local_desc")}
            />
          </div>
        </section>

        {/* Local Language */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">{t("settings.local_language")}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.local_language_desc")}
          </p>
          <select
            value={localLanguage}
            onChange={e => setLocalLanguage(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {LOCAL_LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>
                {t(`language.${lang.value}`)}
              </option>
            ))}
          </select>
        </section>

        {/* 라벨 언어 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">{t("settings.label_language")}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.label_language_desc")}
          </p>
          <div className="flex gap-3">
            <LangOption
              selected={labelLanguage === "en"}
              onClick={() => setLabelLanguage("en")}
              label={t("settings.language_en")}
              description={t("settings.language_en_desc")}
            />
            <LangOption
              selected={labelLanguage === "local"}
              onClick={() => setLabelLanguage("local")}
              label={t("settings.language_local")}
              description={t("settings.language_local_desc")}
            />
          </div>
        </section>

        {/* LLM 설정 */}
        <LlmConfigSection />

        {/* 타임존 */}
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

function LangOption({
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
