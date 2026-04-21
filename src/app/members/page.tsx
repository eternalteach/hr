"use client";

import { useState, useEffect } from "react";
import { MemberAvatar } from "@/components/shared/badges";
import { MemberEditModal } from "@/components/members/MemberEditModal";
import { Plus, X, Mail, Shield, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Member, CommonCode, MemberRole } from "@/lib/types";

const ROLE_OPTIONS: { v: MemberRole; l: string }[] = [
  { v: "admin", l: "관리자" },
  { v: "leader", l: "리더" },
  { v: "member", l: "팀원" },
];

const ROLE_ICON: Record<MemberRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  leader: <Star className="w-3 h-3" />,
  member: <User className="w-3 h-3" />,
};

const ROLE_COLOR: Record<MemberRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  leader: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-600",
};

export default function MembersPage() {
  const { isReadOnly } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [lobs, setLobs] = useState<CommonCode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: MemberRole; lob: string }>({
    name: "", email: "", role: "member", lob: "",
  });

  useEffect(() => {
    fetch("/api/members").then(r => r.json()).then(setMembers);
    fetch("/api/lob").then(r => r.json()).then((data: CommonCode[]) =>
      setLobs(data.filter(c => c.is_active === "Y"))
    );
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lob: form.lob || null }),
    });
    setShowCreate(false);
    setForm({ name: "", email: "", role: "member", lob: "" });
    const res = await fetch("/api/members");
    setMembers(await res.json());
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">팀원 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length}명의 팀원</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />팀원 추가
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => !isReadOnly && setEditTarget(m)}
            className={cn(
              "bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 text-left transition-all",
              isReadOnly ? "cursor-default" : "hover:border-blue-300 hover:shadow-sm"
            )}
          >
            <MemberAvatar name={m.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{m.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />{m.email}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  ROLE_COLOR[m.role]
                )}>
                  {ROLE_ICON[m.role]}
                  {m.role === "admin" ? "관리자" : m.role === "leader" ? "리더" : "팀원"}
                </span>
                {m.lob && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                    {m.lob}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 수정/삭제 모달 */}
      {editTarget && (
        <MemberEditModal
          member={editTarget}
          lobs={lobs}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => setMembers(ms => ms.map(m => m.id === updated.id ? updated as Member : m))}
          onDeleted={id => setMembers(ms => ms.filter(m => m.id !== id))}
        />
      )}

      {/* 추가 모달 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">팀원 추가</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                    <button key={r.v} type="button" onClick={() => setForm(f => ({ ...f, role: r.v }))}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border", form.role === r.v ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-500")}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                <button type="submit" disabled={!form.name || !form.email} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
