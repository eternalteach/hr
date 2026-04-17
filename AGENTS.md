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

## 9. 커밋 전 체크리스트

- [ ] `npm run lint` 통과
- [ ] `npm run test:run` 통과
- [ ] 새 SQL은 `?` 바인딩 사용
- [ ] 새 라우트는 `withApiHandler` 래핑
- [ ] 2개 이상 쓰기는 `withTransaction`
