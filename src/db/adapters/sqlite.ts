import type { Database as SqlJsDatabase, QueryExecResult } from "sql.js";
import type { DbAdapter } from "../adapter";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "tasks.db");

function rowsFromResult<T>(result: QueryExecResult[]): T[] {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as T;
  });
}

export class SqliteAdapter implements DbAdapter {
  readonly dialect = "sqlite" as const;

  constructor(private db: SqlJsDatabase) {}

  async run(sql: string, params: unknown[] = []): Promise<void> {
    this.db.run(sql, params as never);
  }

  async queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return rowsFromResult<T>(this.db.exec(sql, params as never));
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.queryAll<T>(sql, params);
    return rows[0] ?? null;
  }

  async insertAndGetId(sql: string, params: unknown[]): Promise<number> {
    this.db.run(sql, params as never);
    const result = this.db.exec("SELECT last_insert_rowid() AS id");
    return result[0].values[0][0] as number;
  }

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    this.db.run("BEGIN");
    try {
      const result = await fn();
      this.db.run("COMMIT");
      return result;
    } catch (err) {
      this.db.run("ROLLBACK");
      throw err;
    }
  }

  async saveDb(): Promise<void> {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = this.db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  groupConcat(field: string, separator = ","): string {
    return separator === ","
      ? `GROUP_CONCAT(${field})`
      : `GROUP_CONCAT(${field}, '${separator}')`;
  }

  /** sql.js Database 인스턴스 직접 접근 (스키마 초기화용) */
  getRawDb(): SqlJsDatabase {
    return this.db;
  }
}
