"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brd, Lob } from "@/lib/types";

interface Props {
  brd?: Brd | null;
  onClose: () => void;
  onSaved: (brd: Brd) => void;
}

type FormState = Omit<Brd, "id" | "updated_at" | "created_at">;

const EMPTY: FormState = {
  brd_id: "", sow_id: "", lob: "", title_local: "", title_en: "",
  content_local: "", content_en: "",
  note_local: "", note_en: "",
  is_active: "Y",
};

export function BrdFormModal({ brd, onClose, onSaved }: Props) {
  const isEdit = !!brd;
  const [form, setForm] = useState<FormState>(brd ? {
    brd_id: brd.brd_id, sow_id: brd.sow_id, lob: brd.lob ?? "",
    title_local: brd.title_local ?? "", title_en: brd.title_en ?? "",
    content_local: brd.content_local, content_en: brd.content_en,
    note_local: brd.note_local ?? "", note_en: brd.note_en ?? "",
    is_active: brd.is_active,
  } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobs, setLobs] = useState<Lob[]>([]);

  useEffect(() => {
    fetch("/api/lob")
      .then(r => r.json())
      .then((d: Lob[]) => setLobs(d.filter(l => l.is_active === "Y")));
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const url = isEdit ? `/api/brd/${brd!.id}` : "/api/brd";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError(((await res.json()) as { error: string }).error); return; }
    onSaved(await res.json() as Brd);
    onClose();
  };

  const field = (label: string, key: keyof FormState, opts?: { required?: boolean; textarea?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          rows={3}
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
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? "BRD 수정" : "BRD 추가"}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 기본 식별 정보 */}
          <div className="grid grid-cols-2 gap-4">
            {field("BRD ID", "brd_id", { required: true, placeholder: "예) BRD-2026-001" })}
            {field("SOW ID", "sow_id", { required: true, placeholder: "예) SOW-2026-001" })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">LOB</label>
              <select
                value={form.lob ?? ""}
                onChange={e => set("lob", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">선택하세요</option>
                {lobs.map(l => (
                  <option key={l.id} value={l.code}>{l.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BRD 유효여부</label>
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

          {/* 타이틀 */}
          <div className="grid grid-cols-2 gap-4">
            {field("BRD 타이틀 (Local)", "title_local")}
            {field("BRD 타이틀 (영문)", "title_en")}
          </div>

          {/* 내용 */}
          <div className="grid grid-cols-2 gap-4">
            {field("BRD 내용 (Local)", "content_local", { required: true, textarea: true })}
            {field("BRD 내용 (영어)", "content_en", { required: true, textarea: true })}
          </div>

          {/* 비고 */}
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
              disabled={saving || !form.brd_id.trim() || !form.sow_id.trim() || !form.content_local.trim() || !form.content_en.trim()}
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
