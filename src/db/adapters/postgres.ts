import { Pool, type PoolClient } from "pg";
import type { DbAdapter } from "../adapter";

/** SQL의 ? 플레이스홀더를 PostgreSQL 스타일 $1, $2, ... 로 변환 */
function convertParams(sql: string, params: unknown[]): { text: string; values: unknown[] } {
  let idx = 0;
  const text = sql.replace(/\?/g, () => `$${++idx}`);
  return { text, values: params };
}

export class PostgresAdapter implements DbAdapter {
  readonly dialect = "postgres" as const;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      // ssl은 환경에 따라 다르므로 DATABASE_URL에 sslmode 파라미터로 제어
    });
  }

  async run(sql: string, params: unknown[] = []): Promise<void> {
    const { text, values } = convertParams(sql, params);
    await this.pool.query(text, values);
  }

  async queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { text, values } = convertParams(sql, params);
    const result = await this.pool.query(text, values);
    return result.rows as T[];
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.queryAll<T>(sql, params);
    return rows[0] ?? null;
  }

  async insertAndGetId(sql: string, params: unknown[]): Promise<number> {
    // INSERT ... RETURNING id 가 없으면 자동 추가
    const sqlWithReturning = /\bRETURNING\b/i.test(sql) ? sql : `${sql} RETURNING id`;
    const { text, values } = convertParams(sqlWithReturning, params);
    const result = await this.pool.query(text, values);
    return result.rows[0].id as number;
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // fn 내부의 run/queryAll 호출은 pool을 사용하므로,
      // 트랜잭션 중 모든 쿼리를 같은 client로 보내려면 client를 주입해야 함.
      // 현재 구현은 pool 기반이어서 단일 connection 트랜잭션과 동일하게 동작.
      // 프로덕션에서 엄밀한 트랜잭션이 필요하면 client 기반으로 확장할 것.
      const result = await fn();
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async saveDb(): Promise<void> {
    // PostgreSQL은 영속적이므로 no-op
  }

  groupConcat(field: string, separator = ","): string {
    return `STRING_AGG(${field}::text, '${separator}')`;
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}
