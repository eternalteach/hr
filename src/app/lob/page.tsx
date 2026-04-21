"use client";

import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { LobTable } from "@/components/lob/LobTable";
import { LobFormModal } from "@/components/lob/LobFormModal";
import type { Lob } from "@/lib/types";

export default function LobPage() {
  const [rows, setRows] = useState<Lob[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Lob | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Lob | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    fetch("/api/lob").then(r => r.json()).then((d: Lob[]) => { setRows(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleSaved = (saved: Lob) =>
    setRows(prev => prev.some(r => r.id === saved.id)
      ? prev.map(r => r.id === saved.id ? saved : r)
      : [saved, ...prev]
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/lob/${deleteTarget.id}`, { method: "DELETE" });
    setRows(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">LOB 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length}건 · 공통코드</p>
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />LOB 추가
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">로딩 중…</div>
      ) : (
        <LobTable rows={rows} onEdit={lob => setEditTarget(lob)} onDelete={setDeleteTarget} />
      )}

      {editTarget !== undefined && (
        <LobFormModal lob={editTarget} onClose={() => setEditTarget(undefined)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">LOB 삭제</h2>
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
