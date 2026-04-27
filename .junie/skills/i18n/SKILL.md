---
name: i18n
description: >
  Use this skill when asked to apply internationalization (i18n) to new components
  or API routes, or migrate existing hardcoded strings to the i18n system.
---

# i18n (다국어) 적용 스킬

새 컴포넌트나 API 라우트에 다국어를 적용하거나, 기존 하드코딩 문자열을 i18n으로 마이그레이션할 때 이 가이드를 따른다.

## 인프라 구성

| 파일 | 역할 |
|---|---|
| `src/lib/i18n.ts` | 번역 딕셔너리 (local + en) + `useT()` 훅 + `translate()` |
| `src/lib/constants.ts` | `label` (로컬) + `label_en` (영문) 쌍 |
| `src/lib/api-handler.ts` | `ApiError(status, msg, code)` — 세 번째 인자가 에러 코드 |

## 컴포넌트에 적용하는 방법

### 1. useT() 훅으로 라벨 번역

```tsx
"use client";
import { useT } from "@/lib/i18n";

export function MyComponent() {
  const t = useT();

  return (
    <div>
      <h1>{t("task.title")}</h1>
      <button>{t("action.save")}</button>
      <input placeholder={t("task.title_placeholder")} />
    </div>
  );
}
```

### 2. 상태·우선순위 배지 (constants.ts)

```tsx
import { useSettings } from "@/lib/settings-context";
import { TASK_STATUSES } from "@/lib/constants";

const { language } = useSettings();
const config = TASK_STATUSES.find(s => s.value === status);
const label = language === "en" ? config.label_en : config.label;
```

### 3. API 에러 코드 → 프론트엔드 번역

```tsx
// 프론트엔드 fetch 에러 처리
const t = useT();
try {
  const res = await fetch("/api/tasks/1");
  if (!res.ok) {
    const err = await res.json();
    // err.code가 있으면 번역, 없으면 원문 메시지 사용
    throw new Error(err.code ? t(`error.${err.code}`) : err.error);
  }
} catch (e) {
  setErrorMessage(e instanceof Error ? e.message : t("common.error"));
}
```

## API 라우트에 에러 코드 추가하는 방법

```ts
// 기존
throw new ApiError(404, "업무를 찾을 수 없습니다");

// 변경 — 세 번째 인자에 UPPER_SNAKE_CASE 코드 추가
throw new ApiError(404, "업무를 찾을 수 없습니다", "TASK_NOT_FOUND");
```

응답 JSON에 `code` 필드가 자동으로 포함된다:
```json
{ "error": "업무를 찾을 수 없습니다", "code": "TASK_NOT_FOUND" }
```

## 신규 번역 키 추가 절차

1. `src/lib/i18n.ts` 열기
2. `local` 섹션에 한국어 값 추가
3. `en` 섹션에 영문 값 추가 (같은 키, 반드시 양쪽)

```ts
// local 섹션
"my_feature.label": "내 기능",
"my_feature.description": "내 기능 설명",

// en 섹션
"my_feature.label": "My Feature",
"my_feature.description": "My feature description",
```

## 기존 하드코딩 문자열 마이그레이션 순서

1. 컴포넌트 파일에서 한국어 하드코딩 문자열 식별
2. 적절한 키를 `i18n.ts`에 추가 (local + en)
3. 컴포넌트에서 `useT()` 임포트 후 `t("key")`로 교체
4. API 에러의 경우 `ApiError`에 세 번째 인자(코드)만 추가

## 키 네이밍 컨벤션

```
nav.*          — 내비게이션
action.*       — 버튼/액션 (save, cancel, delete, edit, add ...)
status.*       — 업무 상태 (todo, in_progress, review, done)
priority.*     — 우선순위 (urgent, high, medium, low)
schedule.*     — 일정 유형
role.*         — 팀원 역할
dashboard.*    — 대시보드
task.*         — 업무 관련
calendar.*     — 캘린더
member.*       — 팀원
lob.*          — LOB
sow.*          — SOW
brd.*          — BRD
codes.*        — 공통코드
glossary.*     — 용어정의
meeting_notes.*— 회의록
board.*        — 게시판 공통
settings.*     — 설정
auth.*         — 인증
common.*       — 공통 UI
error.*        — API 에러 코드
```
