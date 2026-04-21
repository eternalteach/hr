"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, X, AlertTriangle } from "lucide-react";
import { BrdTable } from "@/components/brd/BrdTable";
import { BrdFormModal } from "@/components/brd/BrdFormModal";
import { ExcelUploadZone, type ColumnDef } from "@/components/excel/ExcelUploadZone";
import type { Brd } from "@/lib/types";

const EXCEL_COLUMNS: ColumnDef[] = [
  { excelHeader: "BRD ID",          field: "brd_id",     required: true },
  { excelHeader: "SOW ID",          field: "sow_id",     required: true },
  { excelHeader: "LOB",             field: "lob" },
  { excelHeader: "BRD 타이틀(Local)", field: "title_local" },
  { excelHeader: "BRD 타이틀(영문)",  field: "title_en" },
  { excelHeader: "BRD 내용(Local)",   field: "content_local", required: true },
  { excelHeader: "BRD 내용(영어)",    field: "content_en", required: true },
  { excelHeader: "비고(Local)",       field: "note_local" },
  { excelHeader: "비고(영어)",        field: "note_en" },
  { excelHeader: "BRD 유효여부",     field: "is_active" },
];

export default function BrdPage() {
  const [rows, setRows] = useState<Brd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Brd | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Brd | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    fetch("/api/brd").then(r => r.json()).then((d: Brd[]) => { setRows(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleSaved = (saved: Brd) =>
    setRows(prev => prev.some(r => r.id === saved.id)
      ? prev.map(r => r.id === saved.id ? saved : r)
      : [saved, ...prev]
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/brd/${deleteTarget.id}`, { method: "DELETE" });
    setRows(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleImport = async (importedRows: Record<string, unknown>[]) => {
    await fetch("/api/brd/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: importedRows }),
    });
    await load();
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">BRD 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length}건</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />엑셀 업로드
          </button>
          <button
            onClick={() => setEditTarget(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />BRD 추가
          </button>
        </div>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">로딩 중…</div>
      ) : (
        <BrdTable rows={rows} onEdit={brd => setEditTarget(brd)} onDelete={setDeleteTarget} />
      )}

      {/* 추가/수정 모달 */}
      {editTarget !== undefined && (
        <BrdFormModal brd={editTarget} onClose={() => setEditTarget(undefined)} onSaved={handleSaved} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">BRD 삭제</h2>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><span className="font-semibold">{deleteTarget.brd_id}</span>를 삭제합니다. 되돌릴 수 없습니다.</p>
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

      {/* 엑셀 업로드 모달 */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">엑셀 업로드</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ExcelUploadZone
                columns={EXCEL_COLUMNS}
                onImport={async rows => { await handleImport(rows); setShowUpload(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
