import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/crypto";
import type { DbAdapter } from "./adapter";
import { SqliteAdapter } from "./adapters/sqlite";
import { PostgresAdapter } from "./adapters/postgres";
import { getDbConfig } from "./config";

const DB_PATH = path.join(process.cwd(), "db", "tasks.db");

let adapter: DbAdapter | null = null;

/** DB 어댑터를 반환 — 싱글톤, 설정에 따라 SQLite 또는 PostgreSQL */
export async function getDb(): Promise<DbAdapter> {
  if (adapter) return adapter;

  const config = getDbConfig();

  if (config.type === "postgres") {
    if (!config.url) throw new Error("DATABASE_URL이 설정되지 않았습니다");
    const pg = new PostgresAdapter(config.url);
    await initPostgresSchema(pg);
    adapter = pg;
  } else {
    const SQL = await initSqlJs();
    let sqliteDb;
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      sqliteDb = new SQL.Database(buffer);
    } else {
      sqliteDb = new SQL.Database();
    }
    sqliteDb.run("PRAGMA foreign_keys = ON");
    const sqliteAdapter = new SqliteAdapter(sqliteDb);
    if (fs.existsSync(DB_PATH)) {
      await migrateSqliteSchema(sqliteAdapter);
    } else {
      await initSqliteSchema(sqliteAdapter);
      await sqliteAdapter.saveDb();
    }
    adapter = sqliteAdapter;
  }

  return adapter;
}

/** 어댑터 싱글톤 초기화 (DB 설정 변경 후 호출) */
export function resetAdapter(): void {
  adapter = null;
}

/** SQLite: DB를 파일로 저장 */
export async function saveDb(): Promise<void> {
  if (adapter) await adapter.saveDb();
}

// ─── SQLite 스키마 ───────────────────────────────────────────────────────────

async function initSqliteSchema(a: SqliteAdapter): Promise<void> {
  const db = a.getRawDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      lob TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','leader','member')),
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
      brd_id INTEGER REFERENCES brd(id),
      created_by INTEGER REFERENCES members(id),
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS task_assignees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      assigned_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS sow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sow_id TEXT NOT NULL UNIQUE,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT NOT NULL,
      content_en TEXT NOT NULL,
      note_local TEXT,
      note_en TEXT,
      milestone TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS brd (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brd_id TEXT NOT NULL UNIQUE,
      sow_id TEXT NOT NULL,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT NOT NULL,
      content_en TEXT NOT NULL,
      note_local TEXT,
      note_en TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS common_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_group TEXT NOT NULL DEFAULT 'LOB',
      code TEXT NOT NULL UNIQUE,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE TABLE IF NOT EXISTS board_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_type TEXT NOT NULL,
      lob TEXT,
      title_local TEXT NOT NULL,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      reference_date TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE INDEX IF NOT EXISTS idx_board_posts_type_lob ON board_posts(board_type, lob);

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_type TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,
      uploaded_by INTEGER REFERENCES members(id),
      uploaded_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES tasks(id),
      member_id INTEGER REFERENCES members(id),
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);
}

async function migrateSqliteSchema(a: SqliteAdapter): Promise<void> {
  const db = a.getRawDb();
  let dirty = false;

  // tasks.position
  const hasPosition = (db.exec(
    "SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='position'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasPosition) {
    db.run("ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
    db.run("UPDATE tasks SET position = id * 1000 WHERE deleted_at IS NULL");
    dirty = true;
  }

  // sow table
  const hasSow = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sow'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasSow) {
    db.run(`
      CREATE TABLE sow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sow_id TEXT NOT NULL UNIQUE,
        lob TEXT,
        title_local TEXT,
        title_en TEXT,
        content_local TEXT NOT NULL,
        content_en TEXT NOT NULL,
        note_local TEXT,
        note_en TEXT,
        milestone TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
    dirty = true;
  } else {
    const sowCols = (db.exec("PRAGMA table_info(sow)")[0]?.values ?? []).map(r => r[1] as string);
    const sowAdditions: [string, string][] = [["title_en", "TEXT"], ["milestone", "TEXT"]];
    sowAdditions.forEach(([col, type]) => {
      if (!sowCols.includes(col)) { db.run(`ALTER TABLE sow ADD COLUMN ${col} ${type}`); dirty = true; }
    });
    const sowRenames: [string, string][] = [
      ["title_ko", "title_local"], ["content_ko", "content_local"], ["note_ko", "note_local"],
    ];
    sowRenames.forEach(([from, to]) => {
      const cur = (db.exec("PRAGMA table_info(sow)")[0]?.values ?? []).map(r => r[1] as string);
      if (cur.includes(from) && !cur.includes(to)) {
        db.run(`ALTER TABLE sow RENAME COLUMN ${from} TO ${to}`); dirty = true;
      }
    });
  }

  // brd table
  const hasBrd = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='brd'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasBrd) {
    db.run(`
      CREATE TABLE brd (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL UNIQUE,
        sow_id TEXT NOT NULL,
        lob TEXT,
        title_local TEXT,
        title_en TEXT,
        content_local TEXT NOT NULL,
        content_en TEXT NOT NULL,
        note_local TEXT,
        note_en TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
    dirty = true;
  } else {
    const brdRenames: [string, string][] = [
      ["title_ko", "title_local"], ["content_ko", "content_local"], ["note_ko", "note_local"],
    ];
    brdRenames.forEach(([from, to]) => {
      const cur = (db.exec("PRAGMA table_info(brd)")[0]?.values ?? []).map(r => r[1] as string);
      if (cur.includes(from) && !cur.includes(to)) {
        db.run(`ALTER TABLE brd RENAME COLUMN ${from} TO ${to}`); dirty = true;
      }
    });
  }

  // common_codes (구 lob → rename)
  const hasOldLob = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='lob'"
  )[0]?.values[0][0] as number) > 0;
  const hasCommonCodes = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='common_codes'"
  )[0]?.values[0][0] as number) > 0;

  if (hasOldLob && !hasCommonCodes) {
    const lobCols = (db.exec("PRAGMA table_info(lob)")[0]?.values ?? []).map(r => r[1] as string);
    if (!lobCols.includes("code_group")) db.run("ALTER TABLE lob ADD COLUMN code_group TEXT NOT NULL DEFAULT 'LOB'");
    db.run("ALTER TABLE lob RENAME TO common_codes");
    dirty = true;
  } else if (!hasCommonCodes) {
    db.run(`
      CREATE TABLE common_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_group TEXT NOT NULL DEFAULT 'LOB',
        code TEXT NOT NULL UNIQUE,
        title_local TEXT, title_en TEXT,
        content_local TEXT, content_en TEXT,
        note_local TEXT, note_en TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
    const seeds = db.exec(`SELECT DISTINCT lob FROM (
      SELECT lob FROM sow WHERE lob IS NOT NULL AND lob != ''
      UNION SELECT lob FROM brd WHERE lob IS NOT NULL AND lob != ''
    )`)[0]?.values ?? [];
    seeds.forEach(row => {
      const code = row[0] as string;
      db.run("INSERT INTO common_codes (code_group, code, title_local, title_en) VALUES ('LOB', ?, ?, ?)", [code, code, code]);
    });
    dirty = true;
  }

  // tasks.brd_id
  const tasksCols = (db.exec("PRAGMA table_info(tasks)")[0]?.values ?? []).map(r => r[1] as string);
  if (!tasksCols.includes("brd_id")) {
    db.run("ALTER TABLE tasks ADD COLUMN brd_id INTEGER REFERENCES brd(id)");
    dirty = true;
  }

  // board_posts
  const hasBoardPosts = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='board_posts'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasBoardPosts) {
    db.run(`
      CREATE TABLE board_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_type TEXT NOT NULL,
        lob TEXT,
        title_local TEXT NOT NULL, title_en TEXT,
        content_local TEXT, content_en TEXT,
        note_local TEXT, note_en TEXT,
        reference_date TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
    db.run("CREATE INDEX idx_board_posts_type_lob ON board_posts(board_type, lob)");
    dirty = true;
  }

  // glossary → board_posts 이관
  const hasLegacyGlossary = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='glossary'"
  )[0]?.values[0][0] as number) > 0;
  if (hasLegacyGlossary) {
    db.run(`INSERT INTO board_posts
      (board_type, lob, title_local, title_en, content_local, content_en, note_local, note_en, is_active, updated_at, created_at)
      SELECT 'glossary', lob, term_local, term_en, definition_local, definition_en, note_local, note_en, is_active, updated_at, created_at
      FROM glossary`);
    db.run("DROP TABLE glossary");
    dirty = true;
  }

  // attachments
  const hasAttachments = (db.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='attachments'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasAttachments) {
    db.run(`
      CREATE TABLE attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_type TEXT NOT NULL, owner_id INTEGER NOT NULL,
        filename TEXT NOT NULL, storage_path TEXT NOT NULL,
        mime_type TEXT, size_bytes INTEGER NOT NULL,
        uploaded_by INTEGER REFERENCES members(id),
        uploaded_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
    db.run("CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id)");
    dirty = true;
  }

  // members.lob 컬럼 + role CHECK 재생성
  const membersCols = (db.exec("PRAGMA table_info(members)")[0]?.values ?? []).map(r => r[1] as string);
  if (!membersCols.includes("lob")) {
    db.run(`CREATE TABLE members_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      avatar_url TEXT, lob TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','leader','member')),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`);
    db.run("INSERT INTO members_new (id,name,email,avatar_url,lob,role,created_at) SELECT id,name,email,avatar_url,NULL,role,created_at FROM members");
    db.run("DROP TABLE members");
    db.run("ALTER TABLE members_new RENAME TO members");
    dirty = true;
  }

  const membersCols2 = (db.exec("PRAGMA table_info(members)")[0]?.values ?? []).map(r => r[1] as string);
  if (!membersCols2.includes("must_change_password")) {
    db.run("ALTER TABLE members ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1");
    dirty = true;
  }
  if (!membersCols2.includes("password_hash")) {
    db.run("ALTER TABLE members ADD COLUMN password_hash TEXT");
    const rows = db.exec("SELECT id, email FROM members")[0]?.values ?? [];
    rows.forEach(([id, email]) => {
      db.run("UPDATE members SET password_hash = ?, must_change_password = 1 WHERE id = ?", [
        hashPassword(email as string), id,
      ]);
    });
    dirty = true;
  }

  if (dirty) await a.saveDb();
}

// ─── PostgreSQL 스키마 ────────────────────────────────────────────────────────

async function initPostgresSchema(a: PostgresAdapter): Promise<void> {
  await a.run(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      lob TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','leader','member')),
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS brd (
      id SERIAL PRIMARY KEY,
      brd_id TEXT NOT NULL UNIQUE,
      sow_id TEXT NOT NULL,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT NOT NULL,
      content_en TEXT NOT NULL,
      note_local TEXT,
      note_en TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','review','done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('urgent','high','medium','low')),
      due_date TEXT,
      completed_at TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      brd_id INTEGER REFERENCES brd(id),
      created_by INTEGER REFERENCES members(id),
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      updated_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS task_assignees (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      assigned_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1'
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      tag_id INTEGER NOT NULL REFERENCES tags(id),
      PRIMARY KEY (task_id, tag_id)
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('meeting','deadline','milestone')),
      start_at TEXT NOT NULL,
      end_at TEXT,
      location TEXT,
      task_id INTEGER REFERENCES tasks(id),
      created_by INTEGER REFERENCES members(id),
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS sow (
      id SERIAL PRIMARY KEY,
      sow_id TEXT NOT NULL UNIQUE,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT NOT NULL,
      content_en TEXT NOT NULL,
      note_local TEXT,
      note_en TEXT,
      milestone TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS common_codes (
      id SERIAL PRIMARY KEY,
      code_group TEXT NOT NULL DEFAULT 'LOB',
      code TEXT NOT NULL UNIQUE,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS board_posts (
      id SERIAL PRIMARY KEY,
      board_type TEXT NOT NULL,
      lob TEXT,
      title_local TEXT NOT NULL,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      reference_date TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE INDEX IF NOT EXISTS idx_board_posts_type_lob ON board_posts(board_type, lob)
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      owner_type TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,
      uploaded_by INTEGER REFERENCES members(id),
      uploaded_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await a.run(`
    CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id)
  `);

  await a.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id),
      member_id INTEGER REFERENCES members(id),
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);
}
