<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 프로젝트 코딩 규칙 (필수)

이전 세션에서 수정된 실수들이 재발하지 않도록 아래 규칙을 반드시 지킨다.
각 규칙은 **왜** 존재하는지와 **어떻게 따르는지**를 함께 둔다.

## 1. SQL은 항상 파라미터 바인딩

**금지**:
```ts
db.exec(`SELECT * FROM tasks WHERE id = ${id}`);           // ❌
db.exec("SELECT * FROM tasks WHERE status = '" + s + "'"); // ❌
```

**필수**:
```ts
db.exec("SELECT * FROM tasks WHERE id = ?", [id]);         // ✅
queryOne(db, "SELECT * FROM tasks WHERE id = ?", [id]);    // ✅
```

Why: 사용자 입력이 쿼리에 합성되면 SQL 인젝션이 된다.
ESLint `no-restricted-syntax` 규칙이 `db.exec` / `db.run`에
템플릿 리터럴(+ 치환식) 전달 시 에러를 낸다.

## 2. URL의 `[id]` 파라미터는 `parseId`로 검증

```ts
function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}
```

Why: 문자열을 그대로 쿼리에 넘기면 예상외 타입으로 조회되고,
바인딩해도 `"abc"` 같은 값이 오면 조회 실패가 500으로 새어나간다.

## 3. 다단계 쓰기는 `withTransaction`

INSERT/UPDATE/DELETE가 2개 이상 연쇄되면 항상 래핑:

```ts
withTransaction(db, () => {
  db.run("INSERT INTO a ...", [...]);
  db.run("INSERT INTO b ...", [...]);
});
saveDb();  // 트랜잭션 밖에서 파일 저장
```

Why: 중간 실패 시 고아 데이터가 남는다.
ROLLBACK으로 메모리 DB 상태를 원자적으로 되돌린다.

## 4. 모든 라우트는 `withApiHandler`로 감싼다

```ts
export const GET = withApiHandler(async (req) => {
  // ...
  if (!task) throw new ApiError(404, "업무를 찾을 수 없습니다");
  return NextResponse.json(task);
});
```

- 검증 실패는 `throw new ApiError(400, "...")`
- 내부 오류는 그냥 throw — 500으로 마스킹되고 서버 로그에 스택이 남는다
- **직접 `try/catch`로 500을 만들지 말 것** — 래퍼에 맡긴다

## 5. DB row → 객체 매핑은 `src/db/helpers.ts` 사용

```ts
queryAll(db, sql, params)       // SELECT → 객체 배열
queryOne(db, sql, params)       // SELECT → 첫 행 또는 null
insertAndGetId(db, sql, params) // INSERT → last rowid
```

**금지**: `db.exec` 직후 `columns.forEach((col,i) => ...)` 수작업 매핑.

## 6. 인증/사용자 id

현재 `created_by: 1`이 하드코딩되어 있다(초기 프로토타입 단계).
**신규 코드에서 이 패턴을 답습하지 말 것** — 요청 컨텍스트에서 주입하도록
설계하고, 미구현 상태라면 TODO 주석으로 명시한다.

## 7. 페이지 파일은 200줄을 넘기지 않는다

`src/app/*/page.tsx`가 200줄 이상이면 `src/components/<도메인>/` 하위로
뷰·모달·폼을 분리한다. 참고: `src/app/calendar/page.tsx` + `src/components/calendar/`.

## 8. 테스트

- 유틸/로직 변경 시 `src/**/*.test.ts` 추가·수정
- 실행: `npm test` (감시), `npm run test:run` (1회)
- 날짜 관련은 `vi.useFakeTimers()` + `vi.setSystemTime`로 고정

## 9. 날짜 계산 — `differenceInCalendarDays` vs `differenceInDays`

D-day처럼 **캘린더 날짜 단위** 비교는 반드시 `differenceInCalendarDays`를 사용한다.

```ts
// ✅ 타임존과 무관하게 날짜(일) 단위 비교
differenceInCalendarDays(parseISO(dueDate), new Date())

// ❌ 시간 성분까지 포함 — 타임존에 따라 D-3이 D-2로 계산되는 버그 발생
differenceInDays(parseISO(dueDate), new Date())
```

Why: `differenceInDays`는 두 시각의 차이를 24시간 단위로 내림하므로,
KST(UTC+9) 환경에서 자정(`parseISO("2026-04-20")`)과 낮 12시 UTC를 비교하면
실제 3일 차이가 2일로 계산된다.

`formatRelativeTime`처럼 "X시간 전", "X일 전" 표시는 시간 성분이 필요하므로
`differenceInDays`를 계속 사용한다.

## 10. npm 보안 취약점 현황 (2026-04-20 기준)

`npm audit`에 **moderate 4건**이 남아 있다 — 모두 `drizzle-kit`이
내부적으로 쓰는 `@esbuild-kit/esm-loader → esbuild ≤0.24.2` 체인이다.

- `drizzle-kit` 최신 stable = `0.31.10` (이미 적용됨), 1.x 정식 출시 전까지 업스트림 fix 없음
- `npm audit fix --force`는 `drizzle-kit@0.18.1`로 **다운그레이드**하므로 실행 금지
- 해당 취약점은 esbuild 개발 서버 cross-origin 요청 노출이며,
  `drizzle-kit`은 개발 서버 없이 CLI 단발 실행만 하므로 **실질 공격 면이 없음**
- 향후 `drizzle-kit` 1.x 출시 시 업그레이드하고 이 항목을 삭제한다

## 11. 다국어 컬럼 네이밍 — `_local` / `_en`

사용자 표시용 텍스트 컬럼은 **`_local`(로컬 언어)** 과 **`_en`(영문)** 두 벌로 저장한다.
`_ko` 같은 특정 언어 이름은 쓰지 않는다 — 로컬 언어가 바뀌어도 스키마가 안정적이다.

```sql
title_local, title_en
content_local, content_en
note_local, note_en
```

Why: 프로젝트가 다른 로케일에 배포될 때 `_ko`는 잘못된 이름이 된다.
`_local`은 "현재 배포의 로컬 언어" 라는 의미를 유지한다.

## 12. 공통코드 — 양방향 다국어 필수

공통코드(예: LOB)의 타이틀·내용·비고는 **local + en 양쪽 모두** 저장한다.
이후 BRD·SOW·Task 등 파생 데이터는 공통코드의 `code`만 참조하고,
표시 시점에 사용자 언어 설정에 따라 `title_local` 또는 `title_en`을 렌더링한다.

Why: 공통코드가 한쪽 언어만 가지면, 영문 리포트나 해외 유저 화면에서 누락된 값이 노출된다.
스키마 시점에 강제해 두어야 누적 입력 데이터가 일관된다.

## 13. 화면 기본 = local, 영문은 옵션

모든 리스트/상세 화면은 **기본적으로 `_local` 컬럼만** 노출한다.
`LanguageProvider` (`src/lib/language-context.tsx`) 의 `showEnglish` 토글이 켜진 경우에만
`_en` 컬럼을 추가로 렌더링한다.

```tsx
const { showEnglish } = useLanguage();

const headers = [
  "타이틀(Local)",
  ...(showEnglish ? ["타이틀(영문)"] : []),
  // ...
];
```

- 토글은 사이드바의 "영문 표시 ON/OFF" 버튼으로 조작
- 선택값은 `localStorage` (`taskflow.showEnglish`) 에 영속화
- 기본값: `false` (로컬만 표시)

Why: 해외 공유용이 아닌 일상 작업에서는 한 언어 컬럼만 보이는 게 훨씬 읽기 쉽다.
필요한 사람만 영문을 켜면 된다.

## 14. LOB → SOW → BRD → Task 계층

- `LOB`: 공통코드 (code 기반) — `src/app/lob`
- `SOW`: LOB에 속함 — `lob` 컬럼이 `lob.code`를 참조 (FK 아님, 문자열 참조)
- `BRD`: SOW에 속함 — `sow_id`, `lob` 컬럼 모두 가짐
- `Task`: 선택적으로 BRD에 연결 — `tasks.brd_id` (INTEGER, `brd.id` 참조)

Task 생성/수정 화면에서는 **LOB 선택 → 해당 LOB의 BRD만 필터링** 되는
캐스케이드 셀렉트를 제공한다. Task 목록 화면은 LOB/SOW/BRD 필터를 모두 제공한다.

## 16. 다국어 (i18n) — UI 라벨·에러 메시지

모든 사용자 표시 텍스트(라벨, 버튼, 플레이스홀더, 에러 메시지)는 하드코딩 금지.
반드시 `useT()` 훅 또는 `label_en` 필드를 통해 다국어를 지원한다.

### 컴포넌트 (React) — `useT()` 훅

```tsx
import { useT } from "@/lib/i18n";

export function MyComponent() {
  const t = useT();
  return (
    <button>{t("action.save")}</button>   // "저장" or "Save"
  );
}
```

- 번역 딕셔너리: `src/lib/i18n.ts` (local + en 양쪽 등록 필수)
- 키가 없으면 키 이름을 그대로 반환한다 — 빠진 키는 즉시 발견됨
- 변수 치환: `t("task.count", { n: 5 })` → `"5개의 업무"` / `"5 tasks"`

### 상수 (constants.ts) — `label_en` 필드

`TASK_STATUSES`, `PRIORITIES`, `SCHEDULE_TYPES`, `NAV_ITEMS` 등에는
`label` (로컬) + `label_en` (영문) 쌍이 모두 존재한다.
컴포넌트에서 `language === "en" ? config.label_en : config.label` 로 선택한다.

### API 에러 — `code` 파라미터

서버에서는 에러 코드를 반환하고, 프론트엔드에서 `useT()`로 번역한다.

```ts
// 서버 (route.ts)
throw new ApiError(404, "업무를 찾을 수 없습니다", "TASK_NOT_FOUND");

// 프론트엔드
const t = useT();
const msg = error.code ? t(`error.${error.code}`) : error.message;
```

- 에러 코드는 UPPER_SNAKE_CASE, `src/lib/i18n.ts`의 `error.*` 키와 매핑
- 기존 메시지 문자열은 그대로 두고 세 번째 인자에만 코드를 추가

### 신규 키 추가 절차

1. `src/lib/i18n.ts`의 `local` 섹션에 한국어 번역 추가
2. `en` 섹션에 영문 번역 추가 (같은 키, 반드시 양쪽 모두)
3. 컴포넌트에서 `t("new.key")` 사용

Why: 하드코딩된 한국어 문자열은 언어 전환 시 바뀌지 않는다.
인프라를 통해 추가·변경이 한 곳에서 관리되어 누락이 없다.

## 17. `withApiHandler` 콜백 서명 — 미사용 파라미터도 선언

`withApiHandler`에 전달하는 콜백은 요청 객체를 실제로 쓰지 않더라도
**반드시 `(_req: NextRequest)` 를 선언**한다.

```ts
// ✅
export const GET = withApiHandler(async (_req: NextRequest) => {
  return NextResponse.json(await fetchData());
});

// ❌ — 테스트에서 GET(req) 한 인자로 호출하면 TS2554 발생
export const GET = withApiHandler(async () => {
  return NextResponse.json(await fetchData());
});
```

Why: 테스트 파일에서 `GET(get("/api/..."))` 처럼 1개 인수로 핸들러를 직접 호출한다.
콜백이 0개 파라미터를 선언하면 TypeScript가 인수 개수 불일치(TS2554)로 에러를 낸다.

## 18. `useEffect` 안의 `setState` — `react-hooks/set-state-in-effect`

ESLint `react-hooks/set-state-in-effect` 규칙은 Effect 내부에서
`setState`(또는 async 함수를 통한 간접 호출)를 금지한다.
아래 세 패턴은 **의도적으로 허용**하며, 각 줄에 `eslint-disable-next-line` 주석을 단다.

### 허용 패턴 1 — localStorage 초기화 (마운트 1회)

```ts
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSettings(loadFromLocalStorage());
}, []);
```

### 허용 패턴 2 — 데이터 fetch (useCallback으로 안정화된 함수)

```ts
const loadData = useCallback(async () => {
  const data = await fetch(...).then(r => r.json());
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setItems(data);
}, []);

useEffect(() => { loadData(); }, [loadData]);
```

> `loadData` 함수는 반드시 `useCallback`으로 감싸서 의존성 배열이 안정적이어야 한다.
> 인라인 async 함수를 Effect 내부에서 정의·호출하면 매 렌더마다 재실행된다.

### 허용 패턴 3 — URL 파라미터로 모달 딥링크 열기

```ts
useEffect(() => {
  const id = searchParams.get("taskId");
  if (id) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(Number(id));
  }
}, [searchParams]);
```

Why: 이 패턴들은 규칙의 의도(무한 루프 방지)를 실제로 위반하지 않는다.
주석 없이 disable 하면 의도가 불명확해지므로 반드시 한 줄짜리 주석을 붙인다.

## 19. JOIN 결과 타입 — `as any` 금지, `types.ts` 확장

SQL JOIN으로 반환되는 평탄화(flat) 컬럼이 기본 인터페이스에 없다면,
`as any` 캐스트 대신 `src/lib/types.ts`의 인터페이스에 **optional 필드**로 추가한다.

```ts
// types.ts
interface Task {
  // ... 기존 필드
  assignee_names?: string | null;  // JOIN 평탄화 필드
}

interface TaskAssignee {
  member_name?: string;  // JOIN 평탄화 필드
}
```

```tsx
// 컴포넌트
<span>{task.assignee_names}</span>       // ✅ — 타입 안전
<span>{(task as any).assignee_names}</span>  // ❌ — 타입 검사 무력화
```

Why: `as any`는 TypeScript 오류를 숨길 뿐 런타임 안전성을 보장하지 않는다.
인터페이스에 미리 선언하면 오탈자나 필드 삭제 시 컴파일 타임에 감지된다.

## 20. recharts `Tooltip` formatter 타입

recharts의 `Tooltip` `formatter` prop에서 세 번째 인자 `entry`의 `payload`는
**옵셔널**이다. 직접 접근하면 TS2322가 발생하므로 인라인 타입과 옵셔널 체이닝을 쓴다.

```tsx
// ✅
<Tooltip
  formatter={(value: number | string, _: string | number, entry: { payload?: { priority?: string } }) => {
    const p = entry.payload?.priority ?? "";
    return [value, t(PRIORITY_KEYS[p] ?? p)];
  }}
/>

// ❌ — entry.payload.priority 직접 접근 시 타입 에러
```

Why: recharts의 내부 `Payload<>` 제네릭에서 `payload` 속성은 `T | undefined`다.
타입 단언 없이 안전하게 쓰려면 옵셔널 체이닝이 필수다.

## 21. 시드 데이터도 `?` 파라미터 바인딩

하드코딩된 상수라도 `db.run` / `db.exec`에 **템플릿 리터럴이나 문자열 연결 금지**.
`datetime('now', ?)` 처럼 SQLite 함수 인자도 바인딩으로 넘긴다.

```ts
// ✅
db.run(
  "INSERT INTO tasks (title, status, due_date) VALUES (?, ?, datetime('now', ?))",
  ["Task A", "todo", "-7 days"]
);

// ❌ — ESLint no-restricted-syntax 에러
db.run(`INSERT INTO tasks (title, status, due_date) VALUES ('Task A', 'todo', datetime('now', '-7 days'))`);
```

Why: ESLint `no-restricted-syntax` 규칙은 `db.run` / `db.exec` 호출에
템플릿 리터럴이 포함되면 무조건 에러를 낸다. 데이터 출처가 상수여도 예외가 없다.

## 15. 커밋 전 체크리스트

- [ ] `npm run lint` 통과
- [ ] `npm run test:run` 통과
- [ ] 새 SQL은 `?` 바인딩 사용 (시드 데이터 포함)
- [ ] 새 라우트는 `withApiHandler` 래핑 + `(_req: NextRequest)` 서명
- [ ] 2개 이상 쓰기는 `withTransaction`
- [ ] JOIN 평탄화 필드는 `types.ts`에 optional로 선언, `as any` 금지
