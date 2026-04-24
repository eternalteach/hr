"use client";

import { X } from "lucide-react";
import { SCHEDULE_TYPES } from "@/lib/constants";
import { useLabel, useT } from "@/lib/i18n";
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
  const lbl = useLabel();
  const t = useT();
  if (!open) return null;

  const set = <K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t("calendar.new_schedule")}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("calendar.event_title")} *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("calendar.event_type")}</label>
            <div className="flex gap-2">
              {SCHEDULE_TYPES.map(t_ => (
                <button
                  key={t_.value}
                  type="button"
                  onClick={() => set("type", t_.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border",
                    form.type === t_.value ? t_.color + " ring-1" : "border-gray-200 text-gray-500"
                  )}
                >
                  {lbl(t_)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("calendar.start")}</label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={e => set("start_at", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("calendar.end")}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("calendar.location")}</label>
              <input
                value={form.location}
                onChange={e => set("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("calendar.location_placeholder")}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
            <button type="submit" disabled={!form.title || !form.start_at} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">{t("task.create")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
