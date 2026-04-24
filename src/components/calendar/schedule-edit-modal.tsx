"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { SCHEDULE_TYPES } from "@/lib/constants";
import { useLabel, useT } from "@/lib/i18n";
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
  const lbl = useLabel();
  const t = useT();
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
      const data = await res.json() as { error?: string; code?: string };
      setError(data.code ? t(`error.${data.code}`) : (data.error ?? t("auth.save_failed")));
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
      const data = await res.json() as { error?: string; code?: string };
      setError(data.code ? t(`error.${data.code}`) : (data.error ?? t("auth.delete_failed")));
      return;
    }
    onDeleted(schedule.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t("calendar.edit_schedule")}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmDelete ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                {t("calendar.delete_schedule_confirm", { title: schedule.title })}
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deleting ? t("common.deleting") : t("auth.confirm_delete")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-4">
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />{t("action.delete")}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t("action.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.start_at}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("action.save")}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
