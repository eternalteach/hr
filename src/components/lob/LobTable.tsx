"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useT } from "@/lib/i18n";
import type { Lob } from "@/lib/types";

interface Props {
  rows: Lob[];
  onEdit: (lob: Lob) => void;
  onDelete: (lob: Lob) => void;
}

const nil = <span className="text-gray-300">-</span>;
const cell = (v: string | null | undefined) => (v ? v : nil);

export function LobTable({ rows, onEdit, onDelete }: Props) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const t = useT();

  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
        {t("lob.empty")}
      </div>
    );
  }

  const headers = [
    t("common.code"),
    isEn ? t("common.col_title_en") : t("common.col_title_local"),
    isEn ? t("common.col_content_en") : t("common.col_content_local"),
    isEn ? t("common.col_note_en") : t("common.col_note_local"),
    t("common.is_active"), "",
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
              <td className="px-4 py-3 font-medium text-gray-900">{row.code}</td>
              <td className="px-4 py-3 max-w-[180px] truncate text-gray-700"
                title={(isEn ? row.title_en : row.title_local) ?? ""}>
                {cell(isEn ? row.title_en : row.title_local)}
              </td>
              <td className="px-4 py-3 max-w-[200px] truncate text-gray-600"
                title={(isEn ? row.content_en : row.content_local) ?? ""}>
                {cell(isEn ? row.content_en : row.content_local)}
              </td>
              <td className="px-4 py-3 max-w-[150px] truncate text-gray-500"
                title={(isEn ? row.note_en : row.note_local) ?? ""}>
                {cell(isEn ? row.note_en : row.note_local)}
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  row.is_active === "Y" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {row.is_active}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(row)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
