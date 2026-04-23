# 통합 게시판 모듈 (`src/components/board`)

여러 게시판(용어 정의, 회의록, …)을 하나의 스키마·API·UI로 운영하기 위한
재사용 모듈. **새 게시판을 추가할 때 새 테이블·새 API·새 컴포넌트를 만들지 않는다** —
`BoardConfig` 만 하나 추가하고 페이지에서 `<BoardPage config={…} />` 로 렌더링한다.

---

## 구성

```
src/lib/boards/config.ts              ← 보드별 라벨·기능 플래그 (BoardConfig)
src/lib/types.ts                      ← BoardType, Post 타입
src/app/api/board/[type]/route.ts     ← GET (목록, ?lob= 필터), POST
src/app/api/board/[type]/[id]/route.ts← PUT, DELETE
src/components/board/
  BoardPage.tsx      ← 최상위 페이지 컴포넌트 (상태·필터·모달 전환)
  BoardTable.tsx     ← 목록 테이블 (행 클릭 → 상세)
  BoardDetailModal.tsx ← 읽기 모드 (마크다운 뷰어)
  BoardFormModal.tsx ← 편집 모드 (원본 텍스트)
```

## 데이터 모델

모든 게시판은 단일 테이블 `board_posts`를 공유하며 `board_type` 컬럼으로 구분한다.

| 컬럼              | 타입      | 설명                                              |
| ----------------- | --------- | ------------------------------------------------- |
| `id`              | INTEGER PK|                                                   |
| `board_type`      | TEXT      | `'glossary' \| 'meeting-notes' \| ...`            |
| `lob`             | TEXT      | `common_codes.code` (LOB) 문자열 참조, nullable   |
| `title_local`     | TEXT      | 제목 (용어/회의명 등) — 필수                      |
| `title_en`        | TEXT      | 영문 제목                                         |
| `content_local`   | TEXT      | 본문 (Markdown)                                   |
| `content_en`      | TEXT      | 본문 영문 (Markdown)                              |
| `note_local`      | TEXT      | 비고 (Markdown)                                   |
| `note_en`         | TEXT      | 비고 영문 (Markdown)                              |
| `reference_date`  | TEXT      | `YYYY-MM-DD` — 회의록처럼 날짜를 쓰는 보드만 사용 |
| `is_active`       | `'Y'/'N'` |                                                   |
| `created_at`, `updated_at` | TEXT |                                                   |

인덱스: `(board_type, lob)` 복합. LOB 필터 조회가 주 경로.

### 왜 단일 테이블인가

- 다국어 (`_local` / `_en`) + LOB 소속 + Markdown 본문이라는 **공통 구조가 강함**
- 보드별 스키마 분리는 "새 보드 = 새 마이그레이션 + 새 API + 새 컴포넌트" 를 강제한다 —
  대부분의 요구사항은 라벨·플레이스홀더 수준이라 과하다
- 보드 특화 필드가 필요하면 두 가지 옵션:
  1. `reference_date`처럼 **nullable 컬럼 추가** + `BoardConfig`에 플래그
  2. 해당 보드 전용 JOIN 테이블 (예: `meeting_attendees(post_id, member_id)`)

## 새 게시판 추가 절차

예: **공지사항(`notices`)** 을 추가한다고 가정.

1. `src/lib/types.ts` — `BoardType`에 리터럴 추가:
   ```ts
   export type BoardType = "glossary" | "meeting-notes" | "notices";
   ```
2. `src/lib/boards/config.ts` — 설정 엔트리 추가:
   ```ts
   export const NOTICES_CONFIG: BoardConfig = {
     type: "notices",
     pageTitle: "공지사항",
     pageDescription: "LOB별 공지",
     addButtonLabel: "공지 추가",
     emptyMessage: "등록된 공지가 없습니다",
     titleLabel: "제목",
     contentLabel: "내용",
     hasReferenceDate: true,
     referenceDateLabel: "게시일",
     searchPlaceholder: "제목 또는 내용 검색…",
     deleteTitle: "공지 삭제",
   };
   export const BOARD_CONFIGS = {
     ...,
     "notices": NOTICES_CONFIG,
   };
   ```
3. `src/app/notices/page.tsx`:
   ```tsx
   "use client";
   import { BoardPage } from "@/components/board/BoardPage";
   import { NOTICES_CONFIG } from "@/lib/boards/config";
   export default function NoticesPage() {
     return <BoardPage config={NOTICES_CONFIG} />;
   }
   ```
4. `src/components/layout/sidebar.tsx` — 링크 추가 (lucide 아이콘 선택).

끝. 새 DB 테이블, API 라우트, 컴포넌트 파일 모두 **추가 없이** 동작한다.

## BoardConfig 레퍼런스

| 필드                   | 필수 | 용도                                             |
| ---------------------- | ---- | ------------------------------------------------ |
| `type`                 | ✅   | `BoardType` — API URL 세그먼트와 DB 값           |
| `pageTitle`            | ✅   | `<h1>` 텍스트                                    |
| `pageDescription`      | ✅   | 헤더 보조 텍스트 (`{N}건 · {설명}`)              |
| `addButtonLabel`       | ✅   | 우상단 "추가" 버튼                               |
| `emptyMessage`         | ✅   | 빈 테이블 플레이스홀더                           |
| `titleLabel`           | ✅   | `title_local/_en` 필드의 UX 라벨                 |
| `contentLabel`         | ✅   | `content_local/_en` 필드의 UX 라벨               |
| `titlePlaceholder`     |      | 제목 input placeholder                            |
| `contentPlaceholder`   |      | 본문 textarea placeholder (마크다운 예시 추천)   |
| `hasReferenceDate`     | ✅   | `reference_date` 사용 여부 (UI·API 둘 다 반영)   |
| `referenceDateLabel`   |      | `hasReferenceDate=true` 일 때 라벨 (예: "회의일")|
| `searchPlaceholder`    | ✅   | 검색창 placeholder                               |
| `deleteTitle`          | ✅   | 삭제 확인 모달 제목                              |
| `deleteSubject`        |      | 삭제 확인 메시지의 식별자 함수 — 기본 `title_local` |

## API 계약

### `GET /api/board/{type}?lob={code}`

`board_type = type` 인 게시글을 `reference_date DESC → created_at DESC → id DESC` 로 반환.
`?lob=` 파라미터로 LOB 필터링 (미지정 시 전체).

### `POST /api/board/{type}`

```json
{
  "lob": "RETAIL",              // optional — null 허용
  "title_local": "…",           // required
  "title_en": "…",
  "content_local": "…",         // markdown
  "content_en": "…",
  "note_local": "…",
  "note_en": "…",
  "reference_date": "2026-04-22", // hasReferenceDate 보드에서만 저장됨
  "is_active": "Y"              // 기본 "Y"
}
```

### `PUT /api/board/{type}/{id}`, `DELETE /api/board/{type}/{id}`

ID가 해당 `board_type`에 속하지 않으면 404 — 다른 보드의 글은 수정/삭제 불가.

모든 라우트는 `withApiHandler`로 감싸져 있고, `parseType()` + `parseId()`로
경로 파라미터를 검증한다. `BoardType`이 아닌 값은 **400**으로 거절.

## UX 규약

- **읽기** (목록의 행, 상세 모달): `content`·`note`를 `MarkdownView`로 렌더.
- **편집** (FormModal): 원본 텍스트를 `font-mono` textarea로 편집.
- **열람 = 행 클릭**: `BoardTable`은 행 클릭으로 `BoardDetailModal`을 연다.
  편집/삭제 버튼은 `stopPropagation`으로 행 클릭과 분리.
- **권한**: `admin` / `leader` 만 추가·수정·삭제. `member`는 읽기만
  (상세 모달은 열 수 있지만 버튼 미노출).
- **언어**: `LanguageProvider` 의 `language === "en"` 일 때만 `_en` 컬럼 렌더.
  상세 모달은 **현재 로케일만** 노출 (반대 언어 병기는 제거됨).
- **검색**: 클라이언트측, `title_local/en`·`content_local/en` 에 대해 소문자 부분일치.

## 테스트 가이드

- 보드별 통합 테스트는 불필요 — BoardConfig만 바뀌므로 라벨 스냅샷으로 충분.
- 스키마/유틸 변경 시 `stripMarkdown()` (src/components/shared/MarkdownView.tsx) 등
  파생 유닛 테스트를 추가한다.
- API 변경 시 `parseType`이 allowlist 기반인지 확인 (신규 보드 등록 누락 시
  400을 반환해야 함).
