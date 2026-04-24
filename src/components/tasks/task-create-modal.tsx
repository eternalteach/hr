"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PRIORITIES } from "@/lib/constants";
import { useLabel, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Member, Tag, Brd } from "@/lib/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function TaskCreateModal({ open, onClose, onSubmit }: TaskCreateModalProps) {
  const lbl = useLabel();
  const t = useT();
  const [members, setMembers] = useState<Member[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [brds, setBrds] = useState<Brd[]>([]);
  const [brdId, setBrdId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assignee_ids: [] as number[],
    tag_ids: [] as number[],
  });

  useEffect(() => {
    if (open) {
      fetch("/api/members").then(r => r.json()).then(setMembers);
      fetch("/api/tags").then(r => r.json()).then(setTags).catch(() => setTags([]));
      fetch("/api/brd").then(r => r.json()).then((d: Brd[]) => setBrds(d.filter(b => b.is_active === "Y")));
    }
  }, [open]);

  if (!open) return null;

  const selectedBrd = brds.find(b => b.id === brdId);
  const lobDisplay = selectedBrd?.lob ?? "";

  const handleBrdChange = (val: string) => {
    setBrdId(val ? Number(val) : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({ ...form, brd_id: brdId, created_by: 1 });
    setForm({ title: "", description: "", priority: "medium", due_date: "", assignee_ids: [], tag_ids: [] });
    setBrdId(null);
    onClose();
  };

  const toggleAssignee = (id: number) => {
    setForm(f => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(id)
        ? f.assignee_ids.filter(x => x !== id)
        : [...f.assignee_ids, id],
    }));
  };

  const brdOptions = brds.map(b => ({
    value: String(b.id),
    label: b.brd_id + (b.title_local ? ` — ${b.title_local}` : ""),
    sub: b.lob ? `LOB: ${b.lob}` : undefined,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t("task.new")}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.name")} *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("task.title_placeholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.description")}</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t("task.desc_placeholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.priority")}</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                      form.priority === p.value ? p.color + " ring-2 ring-offset-1 ring-current" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {lbl(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.due_date")}</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.brd")}</label>
              <SearchableSelect
                value={brdId ? String(brdId) : ""}
                onChange={handleBrdChange}
                options={brdOptions}
                placeholder={t("task.brd_select")}
                searchPlaceholder={t("task.brd_search")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LOB
                <span className="ml-1 text-xs font-normal text-gray-400">{t("task.brd_auto_lob")}</span>
              </label>
              <input
                value={lobDisplay}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder={t("task.brd_auto_placeholder")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("task.assignees")}</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleAssignee(m.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    form.assignee_ids.includes(m.id)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white",
                    form.assignee_ids.includes(m.id) ? "bg-blue-500" : "bg-gray-400"
                  )}>
                    {m.name.slice(0, 1)}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t("action.cancel")}
            </button>
            <button
              type="submit"
              disabled={!form.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("task.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
