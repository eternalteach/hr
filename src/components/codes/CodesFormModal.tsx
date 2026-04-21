"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommonCode } from "@/lib/types";

interface Props {
  code?: CommonCode | null;
  group: string;
  onClose: () => void;
  onSaved: (code: CommonCode) => void;
}

type FormState = Omit<CommonCode, "id" | "code_group" | "updated_at" | "created_at">;

const EMPTY: FormState = {
  code: "",
  title_local: "", title_en: "",
  content_local: "", content_en: "",
  note_local: "", note_en: "",
  is_active: "Y",
};

export function CodesFormModal({ code, group, onClose, onSaved }: Props) {
  const isEdit = !!code;
  const [form, setForm] = useState<FormState>(code ? {
    code: code.code,
    title_local: code.title_local ?? "", title_en: code.title_en ?? "",
    content_local: code.content_local ?? "", content_en: code.content_en ?? "",
    note_local: code.note_local ?? "", note_en: code.note_en ?? "",
    is_active: code.is_active,
  } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const url = isEdit ? `/api/codes/${code!.id}` : "/api/codes";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code_group: group, ...form }),
    });
    setSaving(false);
    if (!res.ok) { setError(((await res.json()) as { error: string }).error); return; }
    onSaved(await res.json() as CommonCode);
    onClose();
  };

  const field = (label: string, key: keyof FormState, opts?: { required?: boolean; textarea?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          rows={2}
          value={String(form[key] ?? "")}
          onChange={e => set(key, e.target.value as FormState[typeof key])}
          placeholder={opts.placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "코드 수정" : "코드 추가"}
            <span className="ml-2 text-xs font-normal text-gray-400">{group}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("코드", "code", { required: true, placeholder: "예) Cloud" })}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">유효여부</label>
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
            {field("타이틀 (Local)", "title_local")}
            {field("타이틀 (영문)", "title_en")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("내용 (Local)", "content_local", { textarea: true })}
            {field("내용 (영어)", "content_en", { textarea: true })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("비고 (Local)", "note_local", { textarea: true })}
            {field("비고 (영어)", "note_en", { textarea: true })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !form.code.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "저장 중…" : isEdit ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
