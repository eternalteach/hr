import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "tasks.db");

let db: SqlJsDatabase | null = null;

/** SQLite DB 인스턴스를 반환 — 없으면 생성 + 스키마 초기화 */
export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    migrateSchema(db);
  } else {
    db = new SQL.Database();
    initSchema(db);
    saveDb(db);
  }

  // WAL 모드는 sql.js에서 미지원 — 대신 동기 모드 사용
  db.run("PRAGMA foreign_keys = ON");
  return db;
}

/** DB를 파일로 저장 */
export function saveDb(database?: SqlJsDatabase) {
  const d = database || db;
  if (!d) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = d.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** 기존 DB에 누락된 컬럼/테이블을 추가하는 마이그레이션 */
function migrateSchema(database: SqlJsDatabase) {
  let dirty = false;

  // tasks.position
  const hasPosition = (database.exec(
    "SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='position'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasPosition) {
    database.run("ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
    database.run("UPDATE tasks SET position = id * 1000 WHERE deleted_at IS NULL");
    dirty = true;
  }

  // sow table
  const hasSow = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sow'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasSow) {
    database.run(`
      CREATE TABLE sow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sow_id TEXT NOT NULL UNIQUE,
        lob TEXT,
        title_ko TEXT,
        title_en TEXT,
        content_ko TEXT NOT NULL,
        content_en TEXT NOT NULL,
        note_ko TEXT,
        note_en TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    dirty = true;
  } else {
    // sow 테이블 컬럼 마이그레이션
    const sowCols = (database.exec("PRAGMA table_info(sow)")[0]?.values ?? []).map(r => r[1] as string);
    const sowAdditions: [string, string][] = [
      ["title_ko", "TEXT"],
      ["title_en", "TEXT"],
      ["milestone", "TEXT"],
    ];
    sowAdditions.forEach(([col, type]) => {
      if (!sowCols.includes(col)) {
        database.run(`ALTER TABLE sow ADD COLUMN ${col} ${type}`);
        dirty = true;
      }
    });
  }

  if (dirty) saveDb(database);
}

/** 스키마 초기화 */
function initSchema(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','review','done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('urgent','high','medium','low')),
      due_date TEXT,
      completed_at TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES members(id),
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_assignees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      tag_id INTEGER NOT NULL REFERENCES tags(id),
      PRIMARY KEY (task_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('meeting','deadline','milestone')),
      start_at TEXT NOT NULL,
      end_at TEXT,
      location TEXT,
      task_id INTEGER REFERENCES tasks(id),
      created_by INTEGER REFERENCES members(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sow_id TEXT NOT NULL UNIQUE,
      lob TEXT,
      title_ko TEXT,
      title_en TEXT,
      content_ko TEXT NOT NULL,
      content_en TEXT NOT NULL,
      note_ko TEXT,
      note_en TEXT,
      milestone TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES tasks(id),
      member_id INTEGER REFERENCES members(id),
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
