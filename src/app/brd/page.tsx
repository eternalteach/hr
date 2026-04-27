"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, X, AlertTriangle } from "lucide-react";
import { BrdTable } from "@/components/brd/BrdTable";
import { BrdFormModal } from "@/components/brd/BrdFormModal";
import { ExcelUploadZone, type ColumnDef } from "@/components/excel/ExcelUploadZone";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import type { Brd } from "@/lib/types";

export default function BrdPage() {
  const { isReadOnly } = useAuth();
  const { dataLanguage } = useSettings();
  const isEn = dataLanguage === "en";
  const t = useT();
  const [rows, setRows] = useState<Brd[]>([]);
  
  const EXCEL_COLUMNS: ColumnDef[] = [
    { excelHeader: "BRD ID", field: "brd_id", required: true, sampleValue: "BRD-2025-001" },
    { excelHeader: "SOW ID", field: "sow_id", required: true, sampleValue: "SOW-2025-001" },
    { excelHeader: "LOB", field: "lob", sampleValue: "RETAIL" },
    ...(isEn ? [
      { excelHeader: t("form.title_en"), field: "title_en", sampleValue: "Product Search Enhancement" },
      { excelHeader: t("form.content_en"), field: "content_en", required: true, sampleValue: "Requirements for product search and filtering" },
      { excelHeader: t("form.note_en"), field: "note_en", sampleValue: "" },
    ] : [
      { excelHeader: t("form.title_local"), field: "title_local", sampleValue: "상품 검색 고도화" },
      { excelHeader: t("form.content_local"), field: "content_local", required: true, sampleValue: "상품 검색 및 필터링 기능 요구사항" },
      { excelHeader: t("form.note_local"), field: "note_local", sampleValue: "" },
    ]),
    { excelHeader: t("common.is_active"), field: "is_active", sampleValue: "Y" },
  ];
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
          <h1 className="text-xl font-semibold text-gray-900">{t("nav.brd")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("common.count", { n: rows.length })}</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" />{t("common.excel_upload")}
            </button>
            <button
              onClick={() => setEditTarget(null)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />{t("brd.add")}
            </button>
          </div>
        )}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">{t("common.loading")}</div>
      ) : (
        <BrdTable
          rows={rows}
          onEdit={isReadOnly ? undefined : brd => setEditTarget(brd)}
          onDelete={isReadOnly ? undefined : setDeleteTarget}
        />
      )}

      {/* 추가/수정 모달 */}
      {!isReadOnly && editTarget !== undefined && (
        <BrdFormModal brd={editTarget} onClose={() => setEditTarget(undefined)} onSaved={handleSaved} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t("brd.delete_title")}</h2>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><span className="font-semibold">{deleteTarget.brd_id}</span>{t("common.delete_suffix")}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t("action.cancel")}</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                  {deleting ? t("common.deleting") : t("action.delete")}
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
              <h2 className="text-base font-semibold text-gray-900">{t("common.excel_upload")}</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ExcelUploadZone
                columns={EXCEL_COLUMNS}
                templateName="BRD_업로드_템플릿"
                onImport={async rows => { await handleImport(rows); setShowUpload(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
