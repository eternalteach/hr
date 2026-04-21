"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  /** 폼에 저장되는 값 */
  value: string;
  /** 드롭다운에 표시되는 주 텍스트 */
  label: string;
  /** 레이블 아래에 표시되는 보조 텍스트 (선택) */
  sub?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * SearchableSelect — 검색 가능한 셀렉트박스
 *
 * 클릭하면 드롭다운이 열리고, 인라인 검색창에 입력하면
 * label·value에 대해 대소문자 무관 LIKE 필터가 적용됩니다.
 * 선택 후 × 버튼으로 값을 초기화할 수 있습니다.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  searchPlaceholder = "검색…",
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim()
    ? options.filter(o => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q) ||
          (o.sub ?? "").toLowerCase().includes(q)
        );
      })
    : options;

  useEffect(() => {
    if (open) {
      setQuery("");
      // 드롭다운 렌더 후 검색창에 포커스
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition-colors bg-white text-left",
          open
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-200 hover:border-gray-300",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      >
        <span className={cn("truncate flex-1", !selected && "text-gray-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[200px]">
          {/* 검색창 */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 옵션 목록 */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">
                검색 결과가 없습니다
              </li>
            ) : (
              filtered.map(opt => (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "flex flex-col px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                    opt.value === value && "bg-blue-50 text-blue-700"
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.sub && (
                    <span className="text-xs text-gray-400 mt-0.5">{opt.sub}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
