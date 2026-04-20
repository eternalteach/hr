"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { SCHEDULE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/lib/types";

interface Props {
  schedule: Schedule;
  onClose: () => void;
  onUpdated: (schedule: Schedule) => void;
  onDeleted: (id: number) => void;
}

function toDatetimeLocal(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

export function ScheduleEditModal({ schedule, onClose, onUpdated, onDeleted }: Props) {
  const [form, setForm] = useState({
    title: schedule.title,
    type: schedule.type as string,
    start_at: toDatetimeLocal(schedule.start_at),
    end_at: toDatetimeLocal(schedule.end_at),
    location: schedule.location ?? "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/schedules/${schedule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError(((await res.json()) as { error: string }).error ?? "저장에 실패했습니다");
      return;
    }
    onUpdated((await res.json()) as Schedule);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/schedules/${schedule.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setError(((await res.json()) as { error: string }).error ?? "삭제에 실패했습니다");
      return;
    }
    onDeleted(schedule.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">일정 수정</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 삭제 확인 */}
        {confirmDelete ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">{schedule.title}</span> 일정을 삭제합니다.
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deleting ? "삭제 중…" : "삭제 확인"}
              </button>
            </div>
          </div>
        ) : (
          /* 수정 폼 */
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                autoFocus
                value={form.title}
                onChange={e => set("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <div className="flex gap-2">
                {SCHEDULE_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border",
                      form.type === t.value ? t.color + " ring-1" : "border-gray-200 text-gray-500"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={e => set("start_at", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={e => set("end_at", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {form.type === "meeting" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                <input
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="회의실, 온라인 등"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />삭제
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.start_at}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
