"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import type { Sow } from "@/lib/types";

interface Props {
  rows: Sow[];
  onEdit?: (sow: Sow) => void;
  onDelete?: (sow: Sow) => void;
}

const nil = <span className="text-gray-300">-</span>;

function cell(val: string | null | undefined) {
  return val ? val : nil;
}

export function SowTable({ rows, onEdit, onDelete }: Props) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
        등록된 SOW가 없습니다
      </div>
    );
  }

  const headers = [
    "SOW ID", "LOB",
    isEn ? "타이틀(EN)" : "타이틀(Local)",
    isEn ? "내용(EN)" : "내용(Local)",
    isEn ? "비고(EN)" : "비고(Local)",
    "마일스톤 시기", "유효여부", "최종수정일",
    ...((onEdit || onDelete) ? [""] : []),
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{row.sow_id}</td>
              <td className="px-4 py-3 text-gray-600 max-w-[100px] truncate">{cell(row.lob)}</td>
              <td className="px-4 py-3 max-w-[150px] truncate text-gray-700"
                title={(isEn ? row.title_en : row.title_local) ?? ""}>
                {cell(isEn ? row.title_en : row.title_local)}
              </td>
              <td className="px-4 py-3 max-w-[180px] truncate text-gray-700"
                title={(isEn ? row.content_en : row.content_local) ?? ""}>
                {cell(isEn ? row.content_en : row.content_local)}
              </td>
              <td className="px-4 py-3 max-w-[120px] truncate text-gray-500"
                title={(isEn ? row.note_en : row.note_local) ?? ""}>
                {cell(isEn ? row.note_en : row.note_local)}
              </td>
              <td className="px-4 py-3 text-gray-600">{cell(row.milestone)}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  row.is_active === "Y" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {row.is_active}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{row.updated_at.slice(0, 10)}</td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
