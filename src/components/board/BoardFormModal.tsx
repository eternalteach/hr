"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useT } from "@/lib/i18n";
import type { Post, Lob } from "@/lib/types";
import type { BoardConfig } from "@/lib/boards/config";

interface Props {
  config: BoardConfig;
  post?: Post | null;
  defaultLob?: string | null;
  lobs: Lob[];
  onClose: () => void;
  onSaved: (post: Post) => void;
}

type FormState = Omit<Post, "id" | "board_type" | "updated_at" | "created_at">;

const makeEmpty = (lob: string | null | undefined): FormState => ({
  lob: lob ?? "",
  title_local: "", title_en: "",
  content_local: "", content_en: "",
  note_local: "", note_en: "",
  reference_date: "",
  is_active: "Y",
});

export function BoardFormModal({ config, post, defaultLob, lobs, onClose, onSaved }: Props) {
  const isEdit = !!post;
  const { language } = useLanguage();
  const t = useT();
  const isEn = language === "en";
  const [form, setForm] = useState<FormState>(post ? {
    lob: post.lob ?? "",
    title_local: post.title_local ?? "", title_en: post.title_en ?? "",
    content_local: post.content_local ?? "", content_en: post.content_en ?? "",
    note_local: post.note_local ?? "", note_en: post.note_en ?? "",
    reference_date: post.reference_date ?? "",
    is_active: post.is_active,
  } : makeEmpty(defaultLob));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const url = isEdit
      ? `/api/board/${config.type}/${post!.id}`
      : `/api/board/${config.type}`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError(((await res.json()) as { error: string }).error); return; }
    onSaved(await res.json() as Post);
    onClose();
  };

  const field = (label: string, key: keyof FormState, opts?: { required?: boolean; textarea?: boolean; markdown?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
        {opts?.markdown && <span className="ml-1.5 text-[10px] font-normal text-gray-400">{t("board.markdown_hint")}</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          rows={opts.markdown ? 8 : 3}
          value={String(form[key] ?? "")}
          onChange={e => set(key, e.target.value as FormState[typeof key])}
          placeholder={opts.placeholder}
          className={cn(
            "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y",
            opts.markdown && "font-mono text-xs leading-relaxed"
          )}
        />
      ) : (
        <input
          value={String(form[key] ?? "")}
          onChange={e => set(key, e.target.value as FormState[typeof key])}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  const canSubmit = !saving && form.title_local.trim().length > 0;
  const titleLabel = t(config.titleLabelKey);
  const contentLabel = t(config.contentLabelKey);
  const localSuffix = t("form.local_suffix");
  const enSuffix = t("form.en_suffix");
  const refDateLabel = config.referenceDateLabelKey ? t(config.referenceDateLabelKey) : t("board.ref_date");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit
              ? t("board.form_title_edit", { title: t(config.pageTitleKey) })
              : t("board.form_title_add", { title: t(config.pageTitleKey) })}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={cn("grid gap-4", config.hasReferenceDate ? "grid-cols-3" : "grid-cols-2")}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">LOB</label>
              <select
                value={form.lob ?? ""}
                onChange={e => set("lob", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">{t("common.select_dash")}</option>
                {lobs.map(l => (
                  <option key={l.code} value={l.code}>
                    {(isEn ? l.title_en : l.title_local) || l.code}
                  </option>
                ))}
              </select>
            </div>
            {config.hasReferenceDate && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {refDateLabel}
                </label>
                <input
                  type="date"
                  value={form.reference_date ?? ""}
                  onChange={e => set("reference_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("board.is_active")}</label>
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

          <div className="grid grid-cols-2 gap-4">
            {field(`${titleLabel} ${localSuffix}`, "title_local", {
              required: true,
              placeholder: config.titlePlaceholder,
            })}
            {field(`${titleLabel} ${enSuffix}`, "title_en")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field(`${contentLabel} ${localSuffix}`, "content_local", {
              textarea: true, markdown: true,
              placeholder: config.contentPlaceholder,
            })}
            {field(`${contentLabel} ${enSuffix}`, "content_en", {
              textarea: true, markdown: true,
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field(`${t("board.note")} ${localSuffix}`, "note_local", { textarea: true, markdown: true })}
            {field(`${t("board.note")} ${enSuffix}`, "note_en", { textarea: true, markdown: true })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
              {t("action.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
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
