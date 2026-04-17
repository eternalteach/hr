"use client";

import { useState, useEffect } from "react";
import { X, Send, Clock } from "lucide-react";
import { PriorityBadge, StatusBadge, MemberAvatar, DDayBadge } from "@/components/shared/badges";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Task, Comment } from "@/lib/types";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
}

export function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (task) {
      fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(setComments).catch(() => setComments([]));
    }
  }, [task]);

  if (!task) return null;

  const handleStatusChange = (status: string) => {
    onUpdate(task.id, { status, member_id: 1 });
  };

  const handlePriorityChange = (priority: string) => {
    onUpdate(task.id, { priority });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment, member_id: 1 }),
    });
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    setComments(await res.json());
    setNewComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 메타 정보 */}
        <div className="p-5 border-b border-gray-100 space-y-3">
          {/* 상태 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-16">상태</span>
            <div className="flex gap-1.5">
              {TASK_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    task.status === s.value ? s.color + " ring-1 ring-offset-1" : "text-gray-400 hover:text-gray-600 bg-gray-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 우선순위 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-16">우선순위</span>
            <div className="flex gap-1.5">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    task.priority === p.value ? p.color + " ring-1 ring-offset-1" : "border-gray-200 text-gray-400 hover:text-gray-600"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 담당자 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-16">담당자</span>
            <div className="flex items-center gap-1.5">
              {task.assignees?.map(a => {
                const name = a.member?.name || (a as any).member_name || "?";
                return (
                  <div key={a.member_id || a.id} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                    <MemberAvatar name={name} size="sm" />
                    <span className="text-xs text-gray-700">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 마감일 */}
          {task.due_date && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-16">마감일</span>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-700">{task.due_date}</span>
                <DDayBadge dueDate={task.due_date} />
              </div>
            </div>
          )}
        </div>

        {/* 댓글 */}
        <div className="flex-1 overflow-auto p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">댓글 ({comments.length})</h3>
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <MemberAvatar name={c.member?.name || (c as any).member_name || "?"} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.member?.name || (c as any).member_name}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">아직 댓글이 없습니다</p>
            )}
          </div>
        </div>

        {/* 댓글 입력 */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddComment()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="댓글을 입력하세요..."
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
