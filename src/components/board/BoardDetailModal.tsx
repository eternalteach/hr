"use client";

import { X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { MarkdownView } from "@/components/shared/MarkdownView";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import type { Post, Lob } from "@/lib/types";
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
  const isEn = language === "en";

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
                  {config.referenceDateLabel ?? "날짜"} · {post.reference_date}
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
                <Pencil className="w-3.5 h-3.5" />수정
              </button>
            )}
            {canEdit && onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />삭제
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
              {config.contentLabel}
            </h3>
            {content.trim()
              ? <MarkdownView content={content} />
              : <p className="text-sm text-gray-400">{config.contentLabel}이 없습니다</p>
            }
          </section>

          {note.trim() && (
            <section className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">비고</h3>
              <MarkdownView content={note} />
            </section>
          )}

          <div className="mt-6">
            <AttachmentList ownerType="board_post" ownerId={post.id} canEdit={canEdit} />
          </div>
        </div>
      </div>
    </div>
  );
}
