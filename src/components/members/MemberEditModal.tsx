"use client";

import { useState } from "react";
import { X, Mail, Shield, Star, User, Trash2, AlertTriangle, KeyRound, Eye, EyeOff } from "lucide-react";
import { MemberAvatar } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import type { Member, CommonCode, MemberRole } from "@/lib/types";

const ROLE_OPTIONS: { v: MemberRole; labelKey: string; icon: React.ReactNode }[] = [
  { v: "admin", labelKey: "role.admin", icon: <Shield className="w-3 h-3" /> },
  { v: "leader", labelKey: "role.leader", icon: <Star className="w-3 h-3" /> },
  { v: "member", labelKey: "role.member", icon: <User className="w-3 h-3" /> },
];

interface Props {
  member: Member;
  lobs: CommonCode[];
  isAdmin?: boolean;
  onClose: () => void;
  onUpdated: (member: Member) => void;
  onDeleted: (id: number) => void;
}

export function MemberEditModal({ member, lobs, isAdmin, onClose, onUpdated, onDeleted }: Props) {
  const t = useT();
  const { showEnglish } = useSettings();
  const { currentUser } = useAuth();
  const isMe = currentUser?.id === member.id;

  const [form, setForm] = useState({
    name: member.name,
    name_en: member.name_en ?? "",
    email: member.email,
    lob: member.lob ?? "",
    role: member.role,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [changing, setChanging] = useState(false);
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
      setError(data.code ? t(`error.${data.code}`) : (data.error ?? t("auth.save_failed")));
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
      setError(data.error ?? t("auth.delete_failed"));
      return;
    }
    onDeleted(member.id);
    onClose();
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    const res = await fetch(`/api/members/${member.id}/reset-password`, { method: "POST" });
    setResetting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.code ? t(`error.${data.code}`) : (data.error ?? t("auth.reset_failed")));
      return;
    }
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError(t("auth.password_mismatch_inline"));
      return;
    }
    if (newPw.length < 8) {
      setError(t("auth.password_too_short"));
      return;
    }

    setChanging(true);
    setError(null);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw || undefined, newPassword: newPw }),
    });

    setChanging(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? t("auth.change_failed"));
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <MemberAvatar name={showEnglish ? (member.name_en || member.name) : member.name} size="lg" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {showEnglish ? (member.name_en || member.name) : member.name}
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  {showEnglish ? member.name : member.name_en}
                </span>
              </h2>
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
                <span className="font-semibold">{member.name}</span>{t("member.delete_confirm_detail")}
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                {deleting ? t("common.deleting") : t("auth.confirm_delete")}
              </button>
            </div>
          </div>
        ) : confirmReset ? (
          /* 비밀번호 초기화 확인 화면 */
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">{member.name}</span>
                {"님 — "}{t("member.reset_password_confirm")}
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmReset(false); setError(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
              <button onClick={handleReset} disabled={resetting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                {resetting ? t("auth.resetting") : t("member.reset_password")}
              </button>
            </div>
          </div>
        ) : showChangePassword ? (
          /* 비밀번호 변경 화면 */
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t("auth.change_password")}</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.current_password")}</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.new_password")}</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.confirm_password")}</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-500 mt-1">{t("auth.password_mismatch_inline")}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowChangePassword(false); setError(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
              <button
                type="submit"
                disabled={changing || !newPw || !confirmPw}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {changing ? t("auth.changing") : t("auth.change_password")}
              </button>
            </div>
          </form>
        ) : (
          /* 수정 폼 */
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("member.name_local")} *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("member.name_en")} *</label>
                <input
                  value={form.name_en}
                  onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("member.email")} *</label>
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
                <option value="">{t("common.none_select")}</option>
                {lobs.map(l => (
                  <option key={l.code} value={l.code}>{l.title_local || l.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("member.role")}</label>
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
                    {r.icon}{t(r.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />{t("action.delete")}
                </button>
                {!isMe && isAdmin && (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <KeyRound className="w-4 h-4" />{t("member.reset_password")}
                  </button>
                )}
                {isMe && (
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <KeyRound className="w-4 h-4" />{t("auth.change_password")}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.name_en.trim() || !form.email.trim()}
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
