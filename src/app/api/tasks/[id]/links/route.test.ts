import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, put, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, PUT } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES (?, 'todo', 'medium', 0)", ["T1"]);
  _db.run(
    "INSERT INTO board_posts (board_type, title_local, reference_date) VALUES ('meeting-notes', ?, ?), ('meeting-notes', ?, ?)",
    ["회의1", "2026-04-20", "회의2", "2026-04-22"]
  );
});

describe("GET /api/tasks/[id]/links", () => {
  it("연결된 회의록을 reference_date 내림차순으로 반환한다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (1, 2)");
    const res = await GET(get("/api/tasks/1/links"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((p: { id: number }) => p.id)).toEqual([2, 1]);
  });

  it("존재하지 않는 업무는 404", async () => {
    const res = await GET(get("/api/tasks/999/links"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("삭제된 업무는 404", async () => {
    _db.run("UPDATE tasks SET deleted_at = datetime('now') WHERE id = 1");
    const res = await GET(get("/api/tasks/1/links"), makeParams({ id: "1" }));
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/tasks/[id]/links", () => {
  it("링크 집합을 교체한다 — 기존 링크 삭제 후 새로 추가", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1)");
    const res = await PUT(put("/api/tasks/1/links", { post_ids: [2] }), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const rows = _db.exec("SELECT post_id FROM task_post_links WHERE task_id = 1");
    expect(rows[0].values).toEqual([[2]]);
  });

  it("빈 배열을 보내면 모든 링크가 제거된다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (1, 2)");
    await PUT(put("/api/tasks/1/links", { post_ids: [] }), makeParams({ id: "1" }));
    const rows = _db.exec("SELECT post_id FROM task_post_links WHERE task_id = 1");
    expect(rows[0]?.values?.length ?? 0).toBe(0);
  });

  it("중복 ID는 한 번만 저장된다", async () => {
    await PUT(put("/api/tasks/1/links", { post_ids: [1, 1, 2] }), makeParams({ id: "1" }));
    const rows = _db.exec("SELECT post_id FROM task_post_links WHERE task_id = 1 ORDER BY post_id");
    expect(rows[0].values).toEqual([[1], [2]]);
  });

  it("존재하지 않는 게시글 ID는 400", async () => {
    const res = await PUT(put("/api/tasks/1/links", { post_ids: [999] }), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("존재하지 않는 업무는 404", async () => {
    const res = await PUT(put("/api/tasks/999/links", { post_ids: [1] }), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });
});
