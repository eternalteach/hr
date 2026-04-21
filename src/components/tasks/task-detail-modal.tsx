"use client";

import { useState, useEffect } from "react";
import { X, Send, Clock, Pencil } from "lucide-react";
import { MemberAvatar, DDayBadge } from "@/components/shared/badges";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Task, Comment, Member, Brd } from "@/lib/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
}

interface EditForm {
  title: string;
  description: string;
  due_date: string;
  assignee_ids: number[];
  brd_id: number | null;
}

export function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", due_date: "", assignee_ids: [], brd_id: null });
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [brds, setBrds] = useState<Brd[]>([]);

  useEffect(() => {
    if (task) {
      fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(setComments).catch(() => setComments([]));
      setIsEditing(false);
    }
  }, [task?.id]);

  if (!task) return null;

  const enterEdit = () => {
    if (!allMembers.length) {
      fetch("/api/members").then(r => r.json()).then(setAllMembers).catch(() => {});
    }
    if (!brds.length) {
      fetch("/api/brd").then(r => r.json()).then((d: Brd[]) => setBrds(d.filter(b => b.is_active === "Y"))).catch(() => {});
    }
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date ?? "",
      assignee_ids: task.assignees?.map(a => a.member_id) ?? [],
      brd_id: task.brd_id ?? null,
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    onUpdate(task.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      due_date: editForm.due_date || null,
      assignee_ids: editForm.assignee_ids,
      brd_id: editForm.brd_id,
    });
    setIsEditing(false);
  };

  const selectedEditBrd = brds.find(b => b.id === editForm.brd_id);
  const editLobDisplay = selectedEditBrd?.lob ?? task.brd_lob ?? "";

  const brdOptions = brds.map(b => ({
    value: String(b.id),
    label: b.brd_id + (b.title_local ? ` — ${b.title_local}` : ""),
    sub: b.lob ? `LOB: ${b.lob}` : undefined,
  }));

  const toggleAssignee = (id: number) =>
    setEditForm(f => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(id)
        ? f.assignee_ids.filter(x => x !== id)
        : [...f.assignee_ids, id],
    }));

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    setComments(await res.json());
    setNewComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                autoFocus
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="w-full text-lg font-semibold text-gray-900 border-b border-blue-400 focus:outline-none pb-0.5 bg-transparent"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            {!isEditing && (
              <button onClick={enterEdit} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="편집">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* 편집 모드 */}
          {isEditing ? (
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="업무 설명 (선택)"
                />
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <div className="flex gap-1.5">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => onUpdate(task.id, { priority: p.value })}
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

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* BRD + LOB 자동 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BRD 연결</label>
                  <SearchableSelect
                    value={editForm.brd_id ? String(editForm.brd_id) : ""}
                    onChange={v => setEditForm(f => ({ ...f, brd_id: v ? Number(v) : null }))}
                    options={brdOptions}
                    placeholder="BRD 선택 (선택 안 함)"
                    searchPlaceholder="BRD ID 또는 타이틀 검색"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LOB
                    <span className="ml-1 text-xs font-normal text-gray-400">(BRD에서 자동)</span>
                  </label>
                  <input
                    value={editLobDisplay}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="BRD 선택 시 자동 설정"
                  />
                </div>
              </div>

              {/* 담당자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                <div className="flex flex-wrap gap-2">
                  {allMembers.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        editForm.assignee_ids.includes(m.id)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <MemberAvatar name={m.name} size="sm" />
                      {m.name}
                    </button>
                  ))}
                  {!allMembers.length && <p className="text-xs text-gray-400">팀원 불러오는 중…</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editForm.title.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </form>
          ) : (
            /* 보기 모드 */
            <>
              <div className="p-5 border-b border-gray-100 space-y-3">
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}

                {/* 상태 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-16">상태</span>
                  <div className="flex gap-1.5">
                    {TASK_STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => onUpdate(task.id, { status: s.value, member_id: 1 })}
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
                        onClick={() => onUpdate(task.id, { priority: p.value })}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.assignees?.map(a => {
                      const name = a.member?.name || (a as unknown as Record<string, unknown>).member_name as string || "?";
                      return (
                        <div key={a.member_id || a.id} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                          <MemberAvatar name={name} size="sm" />
                          <span className="text-xs text-gray-700">{name}</span>
                        </div>
                      );
                    })}
                    {!task.assignees?.length && <span className="text-sm text-gray-400">없음</span>}
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

                {/* BRD 연결 */}
                {task.brd_id && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16">BRD</span>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {task.brd_lob && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{task.brd_lob}</span>}
                      <span className="font-medium">{task.brd_code}</span>
                      {task.brd_title_local && <span className="text-gray-500">· {task.brd_title_local}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* 댓글 */}
              <div className="p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-3">댓글 ({comments.length})</h3>
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <MemberAvatar name={c.member?.name || (c as unknown as Record<string, unknown>).member_name as string || "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{c.member?.name || (c as unknown as Record<string, unknown>).member_name as string}</span>
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
            </>
          )}
        </div>

        {/* 댓글 입력 (보기 모드에서만) */}
        {!isEditing && (
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
        )}
      </div>
    </div>
  );
}
