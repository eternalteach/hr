export type DbDialect = "sqlite" | "postgres";

export interface DbAdapter {
  readonly dialect: DbDialect;

  /** 결과가 필요없는 SQL 실행 (INSERT/UPDATE/DELETE 단건) */
  run(sql: string, params?: unknown[]): Promise<void>;

  /** SELECT → 객체 배열 */
  queryAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /** SELECT → 첫 번째 행 또는 null */
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;

  /** INSERT 후 생성된 id 반환 */
  insertAndGetId(sql: string, params?: unknown[]): Promise<number>;

  /** 여러 쓰기를 원자적으로 감싼다. fn 내부 throw 시 ROLLBACK */
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;

  /** SQLite: 파일로 플러시. PostgreSQL: no-op */
  saveDb(): Promise<void>;

  /** 방언별 집계 SQL 조각 반환: SQLite=GROUP_CONCAT, PG=STRING_AGG */
  groupConcat(field: string, separator?: string): string;
}
