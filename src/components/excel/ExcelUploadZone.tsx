"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { parseExcel, type ColumnDef } from "@/lib/excel-parser";

export type { ColumnDef };

interface ExcelUploadZoneProps {
  /**
   * 엑셀 헤더 ↔ 필드명 매핑 정의.
   * required: true 컬럼이 없으면 오류로 처리.
   */
  columns: ColumnDef[];
  /**
   * 파싱·검증 통과 후 "가져오기" 버튼 클릭 시 호출.
   * Promise를 반환하면 완료될 때까지 버튼이 비활성화된다.
   */
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  disabled?: boolean;
}

type Stage = "idle" | "preview" | "importing" | "done";

/**
 * 드래그-앤-드롭 또는 파일 선택으로 엑셀을 가져오는 재사용 컴포넌트.
 *
 * ## 사용 예시
 * ```tsx
 * import { ExcelUploadZone, type ColumnDef } from "@/components/excel/ExcelUploadZone";
 *
 * const COLUMNS: ColumnDef[] = [
 *   { excelHeader: "SOW ID",       field: "sow_id",     required: true },
 *   { excelHeader: "SOW 내용(Local)", field: "content_local", required: true },
 * ];
 *
 * <ExcelUploadZone
 *   columns={COLUMNS}
 *   onImport={async (rows) => {
 *     await fetch("/api/sow/bulk", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({ rows }),
 *     });
 *   }}
 * />
 * ```
 */
export function ExcelUploadZone({ columns, onImport, disabled }: ExcelUploadZoneProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<{ rows: Record<string, unknown>[]; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParsed({ rows: [], errors: ["xlsx, xls, csv 파일만 지원합니다"] });
      setFileName(file.name);
      setStage("preview");
      return;
    }
    const buffer = await file.arrayBuffer();
    const result = parseExcel(buffer, columns);
    setFileName(file.name);
    setParsed(result);
    setStage("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!parsed || parsed.errors.length > 0) return;
    setStage("importing");
    try {
      await onImport(parsed.rows);
      setStage("done");
    } catch {
      setStage("preview");
    }
  };

  const reset = () => { setStage("idle"); setParsed(null); setFileName(""); };

  if (stage === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-green-700">
        <CheckCircle2 className="w-10 h-10" />
        <p className="text-sm font-medium">가져오기 완료 — {parsed?.rows.length}건</p>
        <button onClick={reset} className="text-xs text-gray-500 hover:underline mt-1">
          다시 업로드
        </button>
      </div>
    );
  }

  if (stage === "preview" || stage === "importing") {
    const hasErrors = (parsed?.errors.length ?? 0) > 0;
    return (
      <div className="space-y-4">
        {/* 파일명 + 초기화 */}
        <div className="flex items-center gap-2 text-sm">
          <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
          <span className="font-medium truncate">{fileName}</span>
          {!hasErrors && <span className="text-gray-400 shrink-0">({parsed?.rows.length}행)</span>}
          <button onClick={reset} className="ml-auto shrink-0 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 오류 목록 */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
            {parsed!.errors.slice(0, 10).map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {e}
              </div>
            ))}
          </div>
        )}

        {/* 미리보기 테이블 */}
        {!hasErrors && parsed && parsed.rows.length > 0 && (
          <div className="overflow-auto rounded-lg border border-gray-200 max-h-56">
            <table className="text-xs w-full">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map(c => (
                    <th key={c.field} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {c.excelHeader}
                      {c.required && <span className="text-red-500 ml-0.5">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    {columns.map(c => (
                      <td key={c.field} className="px-3 py-1.5 text-gray-700 max-w-[180px] truncate">
                        {String(row[c.field] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 5 && (
              <p className="text-xs text-gray-400 text-center py-1.5 border-t border-gray-100">
                … 외 {parsed.rows.length - 5}행
              </p>
            )}
          </div>
        )}

        {/* 액션 */}
        <div className="flex justify-end gap-2">
          <button onClick={reset} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={handleImport}
            disabled={hasErrors || stage === "importing"}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {stage === "importing" ? "가져오는 중…" : `${parsed?.rows.length ?? 0}건 가져오기`}
          </button>
        </div>
      </div>
    );
  }

  // idle — 드롭존
  const requiredLabels = columns.filter(c => c.required).map(c => c.excelHeader).join(", ");
  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => !disabled && inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
        disabled={disabled}
      />
      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">파일을 드래그하거나 클릭해서 선택</p>
      <p className="text-xs text-gray-400 mt-1">.xlsx / .xls / .csv</p>
      {requiredLabels && (
        <p className="text-xs text-gray-400 mt-2">필수 컬럼: {requiredLabels}</p>
      )}
    </div>
  );
}
