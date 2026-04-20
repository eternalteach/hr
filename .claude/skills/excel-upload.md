---
name: excel-upload
description: >
  Use this skill when asked to add Excel upload/import functionality to any page
  in this project. Covers the ExcelUploadZone component, parseExcel utility,
  and bulk API endpoint patterns.
---

# Excel 업로드 기능 추가 가이드

이 프로젝트에는 재사용 가능한 엑셀 업로드 모듈이 구현되어 있습니다.
새 도메인에 엑셀 업로드를 추가할 때는 아래 패턴을 따르세요.

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/lib/excel-parser.ts` | 엑셀 → 객체 배열 변환 (pure function, 브라우저/서버 공통) |
| `src/components/excel/ExcelUploadZone.tsx` | 드래그앤드롭 UI + 미리보기 + 가져오기 버튼 |

## 사용 패턴

### 1. ColumnDef 정의

```tsx
import { type ColumnDef } from "@/components/excel/ExcelUploadZone";

const MY_COLUMNS: ColumnDef[] = [
  { excelHeader: "ID",   field: "item_id",  required: true },
  { excelHeader: "이름", field: "name",      required: true },
  { excelHeader: "비고", field: "note" },
];
```

- `excelHeader`: 엑셀 파일의 헤더 행 텍스트와 **정확히 일치**해야 합니다
- `field`: API로 전송할 JSON 키 이름
- `required: true`: 해당 컬럼이 없으면 파싱 즉시 오류 표시

### 2. 컴포넌트 렌더링

```tsx
import { ExcelUploadZone } from "@/components/excel/ExcelUploadZone";

<ExcelUploadZone
  columns={MY_COLUMNS}
  onImport={async (rows) => {
    const res = await fetch("/api/my-domain/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error("업로드 실패");
    await reload(); // 목록 새로고침
  }}
/>
```

`onImport`는 async 함수여야 하며, 성공 시 컴포넌트가 "완료" 상태로 전환됩니다.
오류(throw)가 발생하면 미리보기 상태로 복귀합니다.

### 3. Bulk API 엔드포인트 패턴

```ts
// src/app/api/my-domain/bulk/route.ts
import { withTransaction } from "@/db/helpers";

export const POST = withApiHandler(async (request) => {
  const { rows } = await request.json();
  withTransaction(db, () => {
    rows.forEach(row => {
      db.run(
        `INSERT INTO my_table (...) VALUES (...)
         ON CONFLICT(unique_key) DO UPDATE SET ...`,
        [...]
      );
    });
  });
  saveDb();
  return NextResponse.json({ upserted: rows.length });
});
```

- 반드시 `withTransaction`으로 묶어 부분 실패를 방지합니다
- `ON CONFLICT ... DO UPDATE SET`으로 upsert 처리하면 중복 키 충돌을 처리합니다

### 4. 모달에서 사용하는 패턴

```tsx
{showUpload && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
       onClick={() => setShowUpload(false)}>
    <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4"
         onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold">엑셀 업로드</h2>
        <button onClick={() => setShowUpload(false)}>...</button>
      </div>
      <div className="p-5">
        <ExcelUploadZone
          columns={MY_COLUMNS}
          onImport={async rows => { await handleImport(rows); setShowUpload(false); }}
        />
      </div>
    </div>
  </div>
)}
```

## parseExcel 직접 사용 (고급)

UI 없이 파싱 로직만 필요한 경우:

```ts
import { parseExcel, type ColumnDef } from "@/lib/excel-parser";

const buffer: ArrayBuffer = await file.arrayBuffer();
const { rows, errors, rawHeaders } = parseExcel(buffer, columns);

if (errors.length > 0) {
  // 오류 처리
} else {
  // rows 사용
}
```

## 참고 — SOW 구현 예시

- UI: `src/app/sow/page.tsx` — `ExcelUploadZone` + 모달 통합 예시
- API: `src/app/api/sow/bulk/route.ts` — upsert 패턴
- 컬럼 정의: `src/app/sow/page.tsx`의 `EXCEL_COLUMNS` 상수
