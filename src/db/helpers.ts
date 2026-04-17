import type { Database as SqlJsDatabase, QueryExecResult } from "sql.js";

type Row = Record<string, unknown>;

/** QueryExecResult의 columns + values 배열을 객체 배열로 변환 */
function rowsFromResult(result: QueryExecResult[]): Row[] {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj: Row = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/** SELECT 실행 후 객체 배열 반환 — 결과 없으면 빈 배열 */
export function queryAll(db: SqlJsDatabase, sql: string, params: unknown[] = []): Row[] {
  return rowsFromResult(db.exec(sql, params as never));
}

/** SELECT 실행 후 첫 행 반환 — 없으면 null */
export function queryOne(db: SqlJsDatabase, sql: string, params: unknown[] = []): Row | null {
  const rows = queryAll(db, sql, params);
  return rows[0] ?? null;
}

/** INSERT 후 생성된 rowid 반환 */
export function insertAndGetId(db: SqlJsDatabase, sql: string, params: unknown[]): number {
  db.run(sql, params as never);
  const result = db.exec("SELECT last_insert_rowid() AS id");
  return result[0].values[0][0] as number;
}
