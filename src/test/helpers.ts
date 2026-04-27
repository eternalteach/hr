import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { NextRequest } from "next/server";

export async function createTestDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE members (
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

    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

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
      data_language TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      data_language TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      data_language TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TEXT,
      completed_at TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      brd_id INTEGER,
      created_by INTEGER,
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE task_assignees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE task_tags (
      task_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (task_id, tag_id)
    );

    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT,
      location TEXT,
      task_id INTEGER,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      data_language TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_board_posts_type_lob ON board_posts(board_type, lob);

    CREATE TABLE attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_type TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,
      uploaded_by INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id);

    CREATE TABLE task_post_links (
      task_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (task_id, post_id)
    );

    CREATE INDEX idx_task_post_links_post ON task_post_links(post_id);

    CREATE TABLE activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      member_id INTEGER,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE llm_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      base_url TEXT,
      api_key TEXT NOT NULL,
      model TEXT,
      is_active TEXT NOT NULL DEFAULT 'Y' CHECK(is_active IN ('Y','N')),
      is_default TEXT NOT NULL DEFAULT 'N' CHECK(is_default IN ('Y','N')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export function get(url: string, params?: Record<string, string>): NextRequest {
  const u = new URL(url.startsWith("http") ? url : `http://localhost${url}`);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return new NextRequest(u.toString(), { method: "GET" });
}

export function post(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function put(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function patch(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function del(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`, { method: "DELETE" });
}

export function makeParams<T extends Record<string, string>>(obj: T): { params: Promise<T> } {
  return { params: Promise.resolve(obj) };
}
