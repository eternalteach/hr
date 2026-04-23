import type { BoardType, Post } from "@/lib/types";

/**
 * 통합 게시판 모듈의 설정 — BoardPage / Table / Form / Detail 컴포넌트가
 * 이 설정만 바꿔 끼면 새 게시판을 만들 수 있도록 라벨·기능 플래그를 모은다.
 *
 * 새 보드 추가 절차:
 *   1. `BoardType`에 새 리터럴 추가 (src/lib/types.ts)
 *   2. 본 파일 BOARD_CONFIGS에 엔트리 추가
 *   3. src/app/<path>/page.tsx 에서 <BoardPage config={BOARD_CONFIGS["..."]} /> 사용
 *   4. sidebar.tsx에 링크 추가
 */
export interface BoardConfig {
  type: BoardType;

  /** 페이지 상단 제목 (예: "용어 정의") */
  pageTitle: string;
  /** 페이지 상단 설명 접미어 — "N건 · {description}" 형태로 렌더 */
  pageDescription: string;

  /** "추가" 버튼 라벨 (예: "용어 추가") */
  addButtonLabel: string;
  /** 빈 상태 메시지 (예: "등록된 용어가 없습니다") */
  emptyMessage: string;

  /** title_local 입력 라벨 (예: "용어") */
  titleLabel: string;
  /** content_local 입력 라벨 (예: "정의") */
  contentLabel: string;
  /** 필드 힌트/플레이스홀더 */
  titlePlaceholder?: string;
  contentPlaceholder?: string;

  /** reference_date 컬럼 사용 여부 (회의록은 true, 용어정의는 false) */
  hasReferenceDate: boolean;
  /** 사용 시 필드 라벨 (예: "회의일") */
  referenceDateLabel?: string;

  /** 검색창 플레이스홀더 */
  searchPlaceholder: string;

  /** 삭제 모달 제목 (예: "용어 삭제") */
  deleteTitle: string;
  /** 삭제 확인 메시지에 강조할 식별자 — 기본은 title_local */
  deleteSubject?: (p: Post) => string;
}

export const GLOSSARY_CONFIG: BoardConfig = {
  type: "glossary",
  pageTitle: "용어 정의",
  pageDescription: "LOB별 용어 관리",
  addButtonLabel: "용어 추가",
  emptyMessage: "등록된 용어가 없습니다",
  titleLabel: "용어",
  contentLabel: "정의",
  titlePlaceholder: "예) 매출채권",
  contentPlaceholder: "# 제목\n\n- 항목 1\n- 항목 2\n\n`code`, **굵게**, [링크](https://…)",
  hasReferenceDate: false,
  searchPlaceholder: "용어 또는 정의 검색…",
  deleteTitle: "용어 삭제",
};

export const MEETING_NOTES_CONFIG: BoardConfig = {
  type: "meeting-notes",
  pageTitle: "회의록",
  pageDescription: "LOB별 회의록 관리",
  addButtonLabel: "회의록 추가",
  emptyMessage: "등록된 회의록이 없습니다",
  titleLabel: "회의명",
  contentLabel: "회의 내용",
  titlePlaceholder: "예) 2026-Q2 KPI 리뷰",
  contentPlaceholder: "## 참석자\n\n- …\n\n## 논의 사항\n\n1. …\n\n## 액션 아이템\n\n- [ ] …",
  hasReferenceDate: true,
  referenceDateLabel: "회의일",
  searchPlaceholder: "회의명 또는 내용 검색…",
  deleteTitle: "회의록 삭제",
};

export const BOARD_CONFIGS: Record<BoardType, BoardConfig> = {
  "glossary": GLOSSARY_CONFIG,
  "meeting-notes": MEETING_NOTES_CONFIG,
};

export function isBoardType(value: string): value is BoardType {
  return value in BOARD_CONFIGS;
}
