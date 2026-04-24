import type { BoardType, Post } from "@/lib/types";

export interface BoardConfig {
  type: BoardType;

  pageTitleKey: string;
  pageDescriptionKey: string;
  addButtonLabelKey: string;
  emptyMessageKey: string;

  titleLabelKey: string;
  contentLabelKey: string;
  titlePlaceholder?: string;
  contentPlaceholder?: string;

  hasReferenceDate: boolean;
  referenceDateLabelKey?: string;

  searchPlaceholderKey: string;
  deleteTitleKey: string;
  deleteSubject?: (p: Post) => string;
}

export const GLOSSARY_CONFIG: BoardConfig = {
  type: "glossary",
  pageTitleKey: "glossary.title",
  pageDescriptionKey: "glossary.page_description",
  addButtonLabelKey: "glossary.add",
  emptyMessageKey: "glossary.empty",
  titleLabelKey: "glossary.term",
  contentLabelKey: "glossary.definition",
  titlePlaceholder: "예) 매출채권",
  contentPlaceholder: "# 제목\n\n- 항목 1\n- 항목 2\n\n`code`, **굵게**, [링크](https://…)",
  hasReferenceDate: false,
  searchPlaceholderKey: "glossary.search_placeholder",
  deleteTitleKey: "glossary.delete_title",
};

export const MEETING_NOTES_CONFIG: BoardConfig = {
  type: "meeting-notes",
  pageTitleKey: "meeting_notes.title",
  pageDescriptionKey: "meeting_notes.page_description",
  addButtonLabelKey: "meeting_notes.add",
  emptyMessageKey: "meeting_notes.empty",
  titleLabelKey: "meeting_notes.name",
  contentLabelKey: "meeting_notes.content",
  titlePlaceholder: "예) 2026-Q2 KPI 리뷰",
  contentPlaceholder: "## 참석자\n\n- …\n\n## 논의 사항\n\n1. …\n\n## 액션 아이템\n\n- [ ] …",
  hasReferenceDate: true,
  referenceDateLabelKey: "meeting_notes.ref_date",
  searchPlaceholderKey: "meeting_notes.search_placeholder",
  deleteTitleKey: "meeting_notes.delete_title",
};

export const BOARD_CONFIGS: Record<BoardType, BoardConfig> = {
  "glossary": GLOSSARY_CONFIG,
  "meeting-notes": MEETING_NOTES_CONFIG,
};

export function isBoardType(value: string): value is BoardType {
  return value in BOARD_CONFIGS;
}
