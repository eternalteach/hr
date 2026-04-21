"use client";

import { useState } from "react";
import { X, Mail, Shield, Star, User, Trash2, AlertTriangle } from "lucide-react";
import { MemberAvatar } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import type { Member, CommonCode, MemberRole } from "@/lib/types";

const ROLE_OPTIONS: { v: MemberRole; l: string; icon: React.ReactNode }[] = [
  { v: "admin", l: "관리자", icon: <Shield className="w-3 h-3" /> },
  { v: "leader", l: "리더",  icon: <Star className="w-3 h-3" /> },
  { v: "member", l: "팀원",  icon: <User className="w-3 h-3" /> },
];

interface Props {
  member: Member;
  lobs: CommonCode[];
  onClose: () => void;
  onUpdated: (member: Member) => void;
  onDeleted: (id: number) => void;
}

export function MemberEditModal({ member, lobs, onClose, onUpdated, onDeleted }: Props) {
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    lob: member.lob ?? "",
    role: member.role,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lob: form.lob || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다");
      return;
    }
    onUpdated(await res.json() as Member);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "삭제에 실패했습니다");
      return;
    }
    onDeleted(member.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <MemberAvatar name={member.name} size="lg" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">{member.name}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Mail className="w-3 h-3" />{member.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 삭제 확인 화면 */}
        {confirmDelete ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">{member.name}</span>을(를) 팀원 목록에서 삭제합니다.
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                {deleting ? "삭제 중…" : "삭제 확인"}
              </button>
            </div>
          </div>
        ) : (
          /* 수정 폼 */
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LOB</label>
              <select
                value={form.lob}
                onChange={e => setForm(f => ({ ...f, lob: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">선택 안함</option>
                {lobs.map(l => (
                  <option key={l.code} value={l.code}>{l.title_local || l.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.v }))}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border",
                      form.role === r.v
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {r.icon}{r.l}
                  </button>
                ))}
              </div>
            </div>

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
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.email.trim()}
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
