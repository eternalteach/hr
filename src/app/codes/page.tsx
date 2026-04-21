"use client";

import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { CodesTable } from "@/components/codes/CodesTable";
import { CodesFormModal } from "@/components/codes/CodesFormModal";
import type { CommonCode } from "@/lib/types";

const GROUPS: { key: string; label: string }[] = [
  { key: "LOB", label: "LOB" },
  { key: "Milestone", label: "마일스톤" },
];

export default function CodesPage() {
  const [activeGroup, setActiveGroup] = useState("LOB");
  const [allRows, setAllRows] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<CommonCode | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CommonCode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    fetch("/api/codes")
      .then(r => r.json())
      .then((d: CommonCode[]) => { setAllRows(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const rows = allRows.filter(r => r.code_group === activeGroup);

  const handleSaved = (saved: CommonCode) =>
    setAllRows(prev => prev.some(r => r.id === saved.id)
      ? prev.map(r => r.id === saved.id ? saved : r)
      : [saved, ...prev]
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/codes/${deleteTarget.id}`, { method: "DELETE" });
    setAllRows(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">공통코드 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length}건</p>
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />코드 추가
        </button>
      </div>

      {/* 그룹 탭 */}
      <div className="flex gap-1 border-b border-gray-200">
        {GROUPS.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroup(g.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeGroup === g.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {g.label}
            <span className="ml-1.5 text-xs text-gray-400">
              ({allRows.filter(r => r.code_group === g.key).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">로딩 중…</div>
      ) : (
        <CodesTable rows={rows} onEdit={setEditTarget} onDelete={setDeleteTarget} />
      )}

      {editTarget !== undefined && (
        <CodesFormModal
          code={editTarget}
          group={activeGroup}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">코드 삭제</h2>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><span className="font-semibold">{deleteTarget.code}</span>를 삭제합니다. 되돌릴 수 없습니다.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
