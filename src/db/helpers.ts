import type { DbAdapter } from "./adapter";

/** SELECT 실행 후 객체 배열 반환 — 결과 없으면 빈 배열 */
export async function queryAll<T = Record<string, unknown>>(
  db: DbAdapter,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return db.queryAll<T>(sql, params);
}

/** SELECT 실행 후 첫 행 반환 — 없으면 null */
export async function queryOne<T = Record<string, unknown>>(
  db: DbAdapter,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  return db.queryOne<T>(sql, params);
}

/** INSERT 후 생성된 id 반환 */
export async function insertAndGetId(
  db: DbAdapter,
  sql: string,
  params: unknown[],
): Promise<number> {
  return db.insertAndGetId(sql, params);
}

/**
 * 다단계 쓰기를 트랜잭션으로 감싼다.
 * fn 내부에서 throw 시 ROLLBACK — DB 상태가 원자적으로 복구됨.
 * (SQLite 파일 저장은 호출자가 성공 후 saveDb()로 수행)
 */
export async function withTransaction<T>(
  db: DbAdapter,
  fn: () => Promise<T>,
): Promise<T> {
  return db.withTransaction(fn);
}
