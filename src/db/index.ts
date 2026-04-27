import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { hashPassword } from "@/lib/crypto";

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
        title_local TEXT,
        title_en TEXT,
        content_local TEXT,
        content_en TEXT,
        note_local TEXT,
        note_en TEXT,
        milestone TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    dirty = true;
  } else {
    const sowCols = (database.exec("PRAGMA table_info(sow)")[0]?.values ?? []).map(r => r[1] as string);

    // 누락 컬럼 추가 (과거 마이그레이션 호환) — _ko 또는 _local 둘 다 없으면 추가
    const sowAdditions: [string, string][] = [
      ["title_en", "TEXT"],
      ["milestone", "TEXT"],
    ];
    sowAdditions.forEach(([col, type]) => {
      if (!sowCols.includes(col)) {
        const sql = `ALTER TABLE sow ADD COLUMN ${col} ${type}`;
        database.run(sql);
        dirty = true;
      }
    });

    // _ko → _local 리네임 (DDL 식별자는 ?로 바인딩 불가 — 값은 하드코딩된 상수)
    const sowRenames: [string, string][] = [
      ["title_ko", "title_local"],
      ["content_ko", "content_local"],
      ["note_ko", "note_local"],
    ];
    sowRenames.forEach(([from, to]) => {
      const current = (database.exec("PRAGMA table_info(sow)")[0]?.values ?? []).map(r => r[1] as string);
      if (current.includes(from) && !current.includes(to)) {
        const sql = `ALTER TABLE sow RENAME COLUMN ${from} TO ${to}`;
        database.run(sql);
        dirty = true;
      }
    });
  }

  // brd table
  const hasBrd = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='brd'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasBrd) {
    database.run(`
      CREATE TABLE brd (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL UNIQUE,
        sow_id TEXT NOT NULL,
        lob TEXT,
        title_local TEXT,
        title_en TEXT,
        content_local TEXT,
        content_en TEXT,
        note_local TEXT,
        note_en TEXT,
        is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    dirty = true;
  } else {
    // _ko → _local 리네임 (DDL 식별자는 ?로 바인딩 불가 — 값은 하드코딩된 상수)
    const brdRenames: [string, string][] = [
      ["title_ko", "title_local"],
      ["content_ko", "content_local"],
      ["note_ko", "note_local"],
    ];
    brdRenames.forEach(([from, to]) => {
      const current = (database.exec("PRAGMA table_info(brd)")[0]?.values ?? []).map(r => r[1] as string);
      if (current.includes(from) && !current.includes(to)) {
        const sql = `ALTER TABLE brd RENAME COLUMN ${from} TO ${to}`;
        database.run(sql);
        dirty = true;
      }
    });
  }

  // common_codes 공통코드 테이블 (구 lob 테이블 → rename 마이그레이션)
  const hasOldLob = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='lob'"
  )[0]?.values[0][0] as number) > 0;
  const hasCommonCodes = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='common_codes'"
  )[0]?.values[0][0] as number) > 0;

  if (hasOldLob && !hasCommonCodes) {
    // lob → common_codes 리네임
    const lobCols = (database.exec("PRAGMA table_info(lob)")[0]?.values ?? []).map(r => r[1] as string);
    if (!lobCols.includes("code_group")) {
      database.run("ALTER TABLE lob ADD COLUMN code_group TEXT NOT NULL DEFAULT 'LOB'");
    }
    database.run("ALTER TABLE lob RENAME TO common_codes");
    dirty = true;
  } else if (!hasCommonCodes) {
    database.run(`
      CREATE TABLE common_codes (
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
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    // 기존 sow/brd의 distinct lob 값으로 시드
    const seeds = database.exec(`
      SELECT DISTINCT lob FROM (
        SELECT lob FROM sow WHERE lob IS NOT NULL AND lob != ''
        UNION
        SELECT lob FROM brd WHERE lob IS NOT NULL AND lob != ''
      )
    `)[0]?.values ?? [];
    seeds.forEach(row => {
      const code = row[0] as string;
      database.run(
        "INSERT INTO common_codes (code_group, code, title_local, title_en) VALUES ('LOB', ?, ?, ?)",
        [code, code, code]
      );
    });
    dirty = true;
  }

  // tasks.brd_id 컬럼 추가
  const tasksCols = (database.exec("PRAGMA table_info(tasks)")[0]?.values ?? []).map(r => r[1] as string);
  if (!tasksCols.includes("brd_id")) {
    database.run("ALTER TABLE tasks ADD COLUMN brd_id INTEGER REFERENCES brd(id)");
    dirty = true;
  }

  // board_posts 통합 게시판 테이블 (+ legacy glossary 마이그레이션)
  const hasBoardPosts = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='board_posts'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasBoardPosts) {
    database.run(`
      CREATE TABLE board_posts (
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
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    database.run("CREATE INDEX idx_board_posts_type_lob ON board_posts(board_type, lob)");
    dirty = true;
  }

  // legacy glossary → board_posts 이관 후 drop
  const hasLegacyGlossary = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='glossary'"
  )[0]?.values[0][0] as number) > 0;
  if (hasLegacyGlossary) {
    database.run(`
      INSERT INTO board_posts
        (board_type, lob, title_local, title_en, content_local, content_en, note_local, note_en, is_active, updated_at, created_at)
      SELECT 'glossary', lob, term_local, term_en, definition_local, definition_en, note_local, note_en, is_active, updated_at, created_at
      FROM glossary
    `);
    database.run("DROP TABLE glossary");
    dirty = true;
  }

  // attachments 테이블 (범용 첨부파일 — owner_type/owner_id로 어떤 도메인에든 부착)
  const hasAttachments = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='attachments'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasAttachments) {
    database.run(`
      CREATE TABLE attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_type TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER NOT NULL,
        uploaded_by INTEGER REFERENCES members(id),
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    database.run("CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id)");
    dirty = true;
  }

  // members.lob 컬럼 추가 + role CHECK에 'leader' 추가 (테이블 재생성)
  const membersCols = (database.exec("PRAGMA table_info(members)")[0]?.values ?? []).map(r => r[1] as string);
  if (!membersCols.includes("lob")) {
    database.run(`
      CREATE TABLE members_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        lob TEXT,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','leader','member')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    database.run(
      "INSERT INTO members_new (id, name, email, avatar_url, lob, role, created_at) SELECT id, name, email, avatar_url, NULL, role, created_at FROM members"
    );
    database.run("DROP TABLE members");
    database.run("ALTER TABLE members_new RENAME TO members");
    dirty = true;
  }

  // task_post_links — 업무 ↔ 회의록(board_post) 양방향 링크
  const hasTaskPostLinks = (database.exec(
    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='task_post_links'"
  )[0]?.values[0][0] as number) > 0;
  if (!hasTaskPostLinks) {
    database.run(`
      CREATE TABLE task_post_links (
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        post_id INTEGER NOT NULL REFERENCES board_posts(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (task_id, post_id)
      )
    `);
    database.run("CREATE INDEX idx_task_post_links_post ON task_post_links(post_id)");
    dirty = true;
  }

  // members.name_en — 영문 이름 (nullable; 기존 행은 NULL로 두고 신규 입력은 폼/API에서 강제)
  const membersColsName = (database.exec("PRAGMA table_info(members)")[0]?.values ?? []).map(r => r[1] as string);
  if (!membersColsName.includes("name_en")) {
    database.run("ALTER TABLE members ADD COLUMN name_en TEXT");
    dirty = true;
  }

  // members.password_hash + must_change_password
  const membersCols2 = (database.exec("PRAGMA table_info(members)")[0]?.values ?? []).map(r => r[1] as string);

  if (!membersCols2.includes("must_change_password")) {
    database.run("ALTER TABLE members ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1");
    dirty = true;
  }

  if (!membersCols2.includes("password_hash")) {
    database.run("ALTER TABLE members ADD COLUMN password_hash TEXT");
    // 기존 팀원 전원: 초기 비밀번호 = email
    const rows = database.exec("SELECT id, email FROM members")[0]?.values ?? [];
    rows.forEach(([id, email]) => {
      database.run("UPDATE members SET password_hash = ?, must_change_password = 1 WHERE id = ?", [
        hashPassword(email as string),
        id,
      ]);
    });
    dirty = true;
  }

  if (dirty) saveDb(database);
}

/** 스키마 초기화 */
function initSchema(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      lob TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','leader','member')),
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 1,
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
      brd_id INTEGER REFERENCES brd(id),
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
      title_local TEXT,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      milestone TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brd (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brd_id TEXT NOT NULL UNIQUE,
      sow_id TEXT NOT NULL,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS board_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_type TEXT NOT NULL,
      lob TEXT,
      title_local TEXT,
      title_en TEXT,
      content_local TEXT,
      content_en TEXT,
      note_local TEXT,
      note_en TEXT,
      reference_date TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);

    CREATE TABLE IF NOT EXISTS task_post_links (
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      post_id INTEGER NOT NULL REFERENCES board_posts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (task_id, post_id)
    );

    CREATE INDEX IF NOT EXISTS idx_task_post_links_post ON task_post_links(post_id);

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
