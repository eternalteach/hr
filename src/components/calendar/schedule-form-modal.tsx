"use client";

import { X } from "lucide-react";
import { SCHEDULE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ScheduleFormState {
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  location: string;
}

interface Props {
  open: boolean;
  form: ScheduleFormState;
  onChange: (next: ScheduleFormState) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ScheduleFormModal({ open, form, onChange, onClose, onSubmit }: Props) {
  if (!open) return null;

  const set = <K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">새 일정</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
            <button type="submit" disabled={!form.title || !form.start_at} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">만들기</button>
          </div>
        </form>
      </div>
    </div>
  );
}
