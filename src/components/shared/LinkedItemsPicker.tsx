"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  /** 현재 연결된 항목 id 목록 */
  selectedIds: number[];
  /** 선택 가능한 후보 항목 — 이미 선택된 것도 포함; 내부에서 필터링 */
  options: SelectOption[];
  /** 항목을 어떻게 그릴지 — selectedIds 각각에 대해 호출 */
  renderItem: (id: number) => React.ReactNode;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  /** 항목 클릭 시 호출 — 제공되면 칩이 클릭 가능한 버튼이 됨 (예: 상세 페이지 이동) */
  onItemClick?: (id: number) => void;
  /** 편집 가능 여부. false면 추가/삭제 버튼 숨김 */
  canEdit?: boolean;
  emptyLabel: string;
  addLabel: string;
  selectPlaceholder: string;
  searchPlaceholder: string;
}

/**
 * 양방향 N:N 링크 편집 — 칩 리스트 + "추가" 버튼 → SearchableSelect 드롭다운.
 * 선택된 id가 이미 있는 옵션은 후보에서 제외된다.
 */
export function LinkedItemsPicker({
  selectedIds,
  options,
  renderItem,
  onAdd,
  onRemove,
  onItemClick,
  canEdit,
  emptyLabel,
  addLabel,
  selectPlaceholder,
  searchPlaceholder,
}: Props) {
  const t = useT();
  const [picking, setPicking] = useState(false);

  const availableOptions = options.filter(
    o => !selectedIds.includes(Number(o.value))
  );

  return (
    <div className="space-y-2">
      {selectedIds.length === 0 && !picking && (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      )}
      {selectedIds.length > 0 && (
        <ul className="space-y-1.5">
          {selectedIds.map(id => (
            <li
              key={id}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-md text-sm",
                onItemClick && "hover:bg-blue-50 transition-colors"
              )}
            >
              {onItemClick ? (
                <button
                  type="button"
                  onClick={() => onItemClick(id)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  {renderItem(id)}
                </button>
              ) : (
                <div className="flex-1 min-w-0">{renderItem(id)}</div>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0"
                  title={t("action.delete")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className={cn(picking ? "space-y-2" : "")}>
          {picking ? (
            <>
              <SearchableSelect
                autoOpen
                value=""
                onChange={v => {
                  if (!v) return;
                  const num = Number(v);
                  if (Number.isInteger(num) && num > 0) onAdd(num);
                  setPicking(false);
                }}
                options={availableOptions}
                placeholder={selectPlaceholder}
                searchPlaceholder={searchPlaceholder}
              />
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t("action.cancel")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              disabled={availableOptions.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
