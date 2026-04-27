"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Trash2, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useT, useLabel } from "@/lib/i18n";
import { MarkdownView } from "@/components/shared/MarkdownView";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { LinkedItemsPicker } from "@/components/shared/LinkedItemsPicker";
import { TASK_STATUSES } from "@/lib/constants";
import type { Post, Lob, Task, LinkedTaskSummary } from "@/lib/types";
import type { BoardConfig } from "@/lib/boards/config";

interface Props {
  config: BoardConfig;
  post: Post;
  lobs: Lob[];
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function BoardDetailModal({ config, post, lobs, canEdit, onEdit, onDelete, onClose }: Props) {
  const { language } = useLanguage();
  const t = useT();
  const lbl = useLabel();
  const isEn = language === "en";

  const showLinkedTasks = config.type === "meeting-notes";
  const [linkedTasks, setLinkedTasks] = useState<LinkedTaskSummary[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!showLinkedTasks) return;
    fetch(`/api/board/${config.type}/${post.id}/links`)
      .then(r => r.json())
      .then(setLinkedTasks)
      .catch(() => setLinkedTasks([]));
  }, [showLinkedTasks, config.type, post.id]);

  useEffect(() => {
    if (!showLinkedTasks) return;
    fetch("/api/tasks").then(r => r.json()).then(setAllTasks).catch(() => setAllTasks([]));
  }, [showLinkedTasks]);

  const updateLinkedTasks = async (nextIds: number[]) => {
    const res = await fetch(`/api/board/${config.type}/${post.id}/links`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_ids: nextIds }),
    });
    if (res.ok) setLinkedTasks(await res.json());
  };

  const taskOptions = allTasks.map(tk => ({
    value: String(tk.id),
    label: tk.title,
    sub: [tk.brd_lob, tk.brd_code].filter(Boolean).join(" · ") || undefined,
  }));
  const linkedTasksById = new Map<number, LinkedTaskSummary>(linkedTasks.map(tk => [tk.id, tk]));

  const title = (isEn ? post.title_en : post.title_local) || post.title_local;
  const content = (isEn ? post.content_en : post.content_local) ?? "";
  const note = (isEn ? post.note_en : post.note_local) ?? "";

  const lobLabel = post.lob
    ? (() => {
        const found = lobs.find(l => l.code === post.lob);
        if (!found) return post.lob;
        return (isEn ? found.title_en : found.title_local) || found.code;
      })()
    : null;

  const refDateLabel = config.referenceDateLabelKey ? t(config.referenceDateLabelKey) : t("board.ref_date");
  const contentLabel = t(config.contentLabelKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {lobLabel && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                  {lobLabel}
                </span>
              )}
              {config.hasReferenceDate && post.reference_date && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full tabular-nums">
                  {refDateLabel} · {post.reference_date}
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                post.is_active === "Y" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {post.is_active}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-1 truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                <Pencil className="w-3.5 h-3.5" />{t("action.edit")}
              </button>
            )}
            {canEdit && onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />{t("action.delete")}
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto flex-1 min-h-0">
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {contentLabel}
            </h3>
            {content.trim()
              ? <MarkdownView content={content} />
              : <p className="text-sm text-gray-400">{t("board.no_content", { label: contentLabel })}</p>
            }
          </section>

          {note.trim() && (
            <section className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("board.note")}</h3>
              <MarkdownView content={note} />
            </section>
          )}

          <div className="mt-6">
            <AttachmentList ownerType="board_post" ownerId={post.id} canEdit={canEdit} />
          </div>

          {showLinkedTasks && (
            <section className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t("task.linked_tasks")}
              </h3>
              <LinkedItemsPicker
                selectedIds={linkedTasks.map(tk => tk.id)}
                options={taskOptions}
                canEdit={canEdit}
                onAdd={id => updateLinkedTasks([...linkedTasks.map(tk => tk.id), id])}
                onRemove={id => updateLinkedTasks(linkedTasks.map(tk => tk.id).filter(x => x !== id))}
                emptyLabel={t("task.linked_tasks_empty")}
                addLabel={t("task.linked_tasks_add")}
                selectPlaceholder={t("task.linked_tasks_select")}
                searchPlaceholder={t("task.linked_tasks_search")}
                renderItem={id => {
                  const tk = linkedTasksById.get(id);
                  if (!tk) return <span className="text-gray-400">#{id}</span>;
                  const statusCfg = TASK_STATUSES.find(s => s.value === tk.status);
                  const isDone = tk.status === "done";
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      {isDone
                        ? <CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 shrink-0" />
                      }
                      <span className={cn("truncate", isDone ? "text-gray-500 line-through" : "text-gray-800")}>
                        {tk.title}
                      </span>
                      {statusCfg && (
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0", statusCfg.color)}>
                          {lbl(statusCfg)}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
