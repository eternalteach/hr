"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useT } from "@/lib/i18n";
import { stripMarkdown } from "@/components/shared/MarkdownView";
import type { Post, Lob } from "@/lib/types";
import type { BoardConfig } from "@/lib/boards/config";

interface Props {
  config: BoardConfig;
  rows: Post[];
  lobs: Lob[];
  showLobColumn?: boolean;
  onOpen?: (row: Post) => void;
  onEdit?: (row: Post) => void;
  onDelete?: (row: Post) => void;
}

const nil = <span className="text-gray-300">-</span>;
const cell = (v: string | null | undefined) => (v ? v : nil);

export function BoardTable({ config, rows, lobs, showLobColumn, onOpen, onEdit, onDelete }: Props) {
  const { language } = useLanguage();
  const t = useT();
  const isEn = language === "en";

  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
        {t(config.emptyMessageKey)}
      </div>
    );
  }

  const lobLabel = (code: string | null): string => {
    if (!code) return "";
    const found = lobs.find(l => l.code === code);
    if (!found) return code;
    return (isEn ? found.title_en : found.title_local) || found.code;
  };

  const titleLabel = t(config.titleLabelKey);
  const contentLabel = t(config.contentLabelKey);
  const localSuffix = t("form.local_suffix");
  const enSuffix = t("form.en_suffix");

  const headers: string[] = [
    ...(showLobColumn ? ["LOB"] : []),
    ...(config.hasReferenceDate ? [config.referenceDateLabelKey ? t(config.referenceDateLabelKey) : t("board.ref_date")] : []),
    isEn ? `${titleLabel}${enSuffix}` : `${titleLabel}${localSuffix}`,
    isEn ? `${contentLabel}${enSuffix}` : `${contentLabel}${localSuffix}`,
    isEn ? `${t("board.note")}${enSuffix}` : `${t("board.note")}${localSuffix}`,
    t("board.is_active"),
    ...((onEdit || onDelete) ? [""] : []),
  ];

  const contentOf = (r: Post) => stripMarkdown((isEn ? r.content_en : r.content_local) ?? "");
  const noteOf = (r: Post) => stripMarkdown((isEn ? r.note_en : r.note_local) ?? "");

  return (
    <div className="border border-gray-200 rounded-xl overflow-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const contentPreview = contentOf(row);
            const notePreview = noteOf(row);
            return (
              <tr
                key={row.id}
                onClick={onOpen ? () => onOpen(row) : undefined}
                className={cn(
                  "border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors",
                  onOpen && "cursor-pointer"
                )}
              >
                {showLobColumn && (
                  <td className="px-4 py-3 text-gray-700">
                    {row.lob ? lobLabel(row.lob) : nil}
                  </td>
                )}
                {config.hasReferenceDate && (
                  <td className="px-4 py-3 text-gray-600 tabular-nums">
                    {cell(row.reference_date)}
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[260px] truncate"
                  title={(isEn ? row.title_en : row.title_local) ?? ""}>
                  {cell(isEn ? row.title_en : row.title_local)}
                </td>
                <td className="px-4 py-3 max-w-[360px] truncate text-gray-600"
                  title={contentPreview}>
                  {contentPreview || nil}
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate text-gray-500"
                  title={notePreview}>
                  {notePreview || nil}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    row.is_active === "Y" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {row.is_active}
                  </span>
                </td>
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
