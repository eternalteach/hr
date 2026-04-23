@AGENTS.md

# 프로젝트 빠른 참조

## 실행 명령

```bash
npm run dev        # 개발 서버 http://localhost:3000
npm run verify     # lint + tsc + test:run 통합 검사
npm run test:run   # 단회 테스트
```

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `src/db/index.ts` | SQLite 스키마, 마이그레이션, `saveDb()` |
| `src/db/helpers.ts` | `queryAll` / `queryOne` / `insertAndGetId` |
| `src/lib/api-handler.ts` | `withApiHandler` + `ApiError` |
| `src/lib/types.ts` | 전체 TypeScript 타입 |
| `src/lib/language-context.tsx` | `showEnglish` 토글 컨텍스트 |
| `src/lib/constants.ts` | 업무 상태, 우선순위 상수 |

## 데이터 계층 구조

```
LOB (common_codes, code_group='LOB')
 └─ SOW (sow.lob → lob.code)
     └─ BRD (brd.sow_id, brd.lob)
         └─ Task (tasks.brd_id, optional)

board_posts — board_type: 'glossary' | 'meeting-notes'
```

## 신규 API 라우트 체크리스트

- [ ] `withApiHandler()` 래핑
- [ ] `parseId()` — URL `[id]` 파라미터 검증
- [ ] `withTransaction()` — INSERT/UPDATE/DELETE 2개 이상
- [ ] SQL `?` 바인딩 (ESLint 자동 감지)
- [ ] `queryAll` / `queryOne` / `insertAndGetId` 사용 (직접 row 매핑 금지)

## 다국어 컬럼 규칙

마스터 데이터 텍스트 컬럼 = `_local` + `_en` 쌍으로 저장.  
화면 기본은 `_local`만 표시, `showEnglish` 켜지면 `_en` 추가 렌더링.

## i18n (UI 라벨·에러 메시지)

| 상황 | 방법 |
|---|---|
| 컴포넌트 라벨·버튼·플레이스홀더 | `useT()` 훅 (`src/lib/i18n.ts`) |
| 상태·우선순위 배지 | `TASK_STATUSES[x].label` / `.label_en` |
| API 에러 번역 | `throw new ApiError(status, "한국어", "ERROR_CODE")` → 프론트엔드 `t(\`error.\${code}\`)` |
| 신규 키 추가 | `i18n.ts`의 `local` + `en` 섹션 양쪽에 동시 등록 |

```tsx
// 컴포넌트 사용 예
const t = useT();
<button>{t("action.save")}</button>          // "저장" or "Save"
<h1>{t("task.title")}</h1>                   // "업무 관리" or "Tasks"
const msg = error.code ? t(`error.${error.code}`) : error.message;
```

## 보안 취약점 현황

`npm audit` moderate 4건 — drizzle-kit 내부 esbuild 체인.  
`npm audit fix --force` **실행 금지** (drizzle-kit 다운그레이드됨).  
drizzle-kit 1.x 출시 시 업그레이드 예정.
