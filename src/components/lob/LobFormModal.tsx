"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import type { Lob } from "@/lib/types";

interface Props {
  lob?: Lob | null;
  onClose: () => void;
  onSaved: (lob: Lob) => void;
}

type FormState = Omit<Lob, "id" | "updated_at" | "created_at">;

export function LobFormModal({ lob, onClose, onSaved }: Props) {
  const t = useT();
  const { dataLanguage } = useSettings();
  const isEn = dataLanguage === "en";
  const isEdit = !!lob;

  const [form, setForm] = useState<FormState>(lob ? {
    code: lob.code,
    title_local: lob.title_local ?? "", title_en: lob.title_en ?? "",
    content_local: lob.content_local ?? "", content_en: lob.content_en ?? "",
    note_local: lob.note_local ?? "", note_en: lob.note_en ?? "",
    is_active: lob.is_active,
    data_language: lob.data_language,
  } : {
    code: "",
    title_local: "", title_en: "",
    content_local: "", content_en: "",
    note_local: "", note_en: "",
    is_active: "Y",
    data_language: dataLanguage,
  });

  const registrationLanguage = form.data_language || (isEdit ? null : dataLanguage);
  const isReadOnly = isEdit && registrationLanguage && registrationLanguage !== dataLanguage;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const url = isEdit ? `/api/lob/${lob!.id}` : "/api/lob";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError(((await res.json()) as { error: string }).error); return; }
    onSaved(await res.json() as Lob);
    onClose();
  };

  const field = (label: string, key: keyof FormState, opts?: { required?: boolean; textarea?: boolean; placeholder?: string }) => {
    const readOnly = isReadOnly && (key.endsWith("_local") || key.endsWith("_en"));
    const placeholder = readOnly ? "(Auto-translated)" : opts?.placeholder;

    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {opts?.textarea ? (
          <textarea
            rows={2}
            value={String(form[key] ?? "")}
            onChange={e => set(key, e.target.value as FormState[typeof key])}
            placeholder={placeholder}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
        ) : (
          <input
            value={String(form[key] ?? "")}
            onChange={e => set(key, e.target.value as FormState[typeof key])}
            placeholder={placeholder}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? t("lob.edit") : t("lob.add")}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field(t("common.code"), "code", { required: true, placeholder: t("form.code_placeholder") })}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("common.is_active")}</label>
              <div className="flex gap-2 mt-1.5">
                {(["Y", "N"] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set("is_active", v)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      form.is_active === v
                        ? v === "Y" ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-100 border-gray-300 text-gray-600"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isEn ? field(t("form.title_en"), "title_en") : field(t("form.title_local"), "title_local")}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isEn ? field(t("form.content_en"), "content_en", { textarea: true }) : field(t("form.content_local"), "content_local", { textarea: true })}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isEn ? field(t("form.note_en"), "note_en", { textarea: true }) : field(t("form.note_local"), "note_local", { textarea: true })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
              {t("action.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || !form.code.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {saving ? t("common.saving") : isEdit ? t("action.edit") : t("action.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
