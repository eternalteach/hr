import * as XLSX from "xlsx";

/** 엑셀 컬럼 하나의 매핑 정의 */
export interface ColumnDef {
  /** 엑셀 파일의 헤더 텍스트 */
  excelHeader: string;
  /** 출력 객체에서 사용할 필드명 */
  field: string;
  /** true이면 해당 헤더가 없을 때 오류 반환 */
  required?: boolean;
}

export interface ParseResult {
  rows: Record<string, unknown>[];
  /** 파싱/검증 중 발생한 오류 메시지 목록 */
  errors: string[];
  /** 파일에서 실제로 읽은 헤더 목록 (디버깅 용도) */
  rawHeaders: string[];
}

/**
 * ArrayBuffer(엑셀/CSV) → 객체 배열 변환
 *
 * - 첫 번째 시트의 첫 행을 헤더로 사용
 * - `columns`의 `excelHeader`와 헤더를 매칭해 `field`로 변환
 * - `required: true` 컬럼이 헤더에 없으면 즉시 오류 반환
 * - 오류는 최대 10건까지만 수집
 *
 * @example
 * const result = parseExcel(buffer, [
 *   { excelHeader: "SOW ID", field: "sow_id", required: true },
 *   { excelHeader: "SOW 내용(Local)", field: "content_local", required: true },
 * ]);
 * if (result.errors.length) console.error(result.errors);
 * else console.log(result.rows);
 */
export function parseExcel(buffer: ArrayBuffer, columns: ColumnDef[]): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false, // 날짜·숫자를 문자열로 통일
  });

  if (rawRows.length === 0) {
    return { rows: [], errors: ["시트에 데이터가 없습니다"], rawHeaders: [] };
  }

  const rawHeaders = Object.keys(rawRows[0]);
  const errors: string[] = [];

  // 필수 헤더 존재 확인
  const missing = columns.filter(c => c.required && !rawHeaders.includes(c.excelHeader));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`필수 컬럼이 없습니다: ${missing.map(c => c.excelHeader).join(", ")}`],
      rawHeaders,
    };
  }

  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    if (errors.length >= 10) break; // 오류 10건에서 중단

    const raw = rawRows[i];
    const row: Record<string, unknown> = {};

    columns.forEach(col => {
      row[col.field] = rawHeaders.includes(col.excelHeader)
        ? (raw[col.excelHeader] ?? null)
        : null;
    });

    // 필수 값 검사
    columns.filter(c => c.required).forEach(col => {
      if (!row[col.field]) {
        errors.push(`${i + 2}행: "${col.excelHeader}" 값이 없습니다`);
      }
    });

    rows.push(row);
  }

  return { rows, errors, rawHeaders };
}
