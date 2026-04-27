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
  _db.run("INSERT INTO board_posts (board_type, title_local) VALUES ('meeting-notes', '주간 회의')");
  _db.run(
    "INSERT INTO tasks (title, status, priority, position) VALUES (?, 'todo', 'medium', 0), (?, 'done', 'high', 0), (?, 'in_progress', 'low', 0)",
    ["A", "B", "C"]
  );
});

describe("GET /api/board/[type]/[id]/links", () => {
  it("연결된 업무를 status와 함께 반환한다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (2, 1)");
    const res = await GET(get("/api/board/meeting-notes/1/links"), makeParams({ type: "meeting-notes", id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    const byId = Object.fromEntries(body.map((t: { id: number; status: string }) => [t.id, t.status]));
    expect(byId[1]).toBe("todo");
    expect(byId[2]).toBe("done");
  });

  it("각 업무의 담당자 이름·id가 함께 반환된다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES ('홍길동','hong@test.com','member'), ('김영희','kim@test.com','member')");
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (2, 1)");
    _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1), (1, 2), (2, 2)");
    const res = await GET(get("/api/board/meeting-notes/1/links"), makeParams({ type: "meeting-notes", id: "1" }));
    const body = await res.json();
    const t1 = body.find((t: { id: number }) => t.id === 1);
    const t2 = body.find((t: { id: number }) => t.id === 2);
    expect(t1.assignees.map((a: { member_name: string }) => a.member_name).sort()).toEqual(["김영희","홍길동"]);
    expect(t2.assignees).toEqual([{ member_id: 2, member_name: "김영희" }]);
  });

  it("담당자가 없는 업무는 빈 배열을 반환한다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1)");
    const res = await GET(get("/api/board/meeting-notes/1/links"), makeParams({ type: "meeting-notes", id: "1" }));
    const body = await res.json();
    expect(body[0].assignees).toEqual([]);
  });

  it("삭제된 업무는 결과에서 제외된다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (2, 1)");
    _db.run("UPDATE tasks SET deleted_at = datetime('now') WHERE id = 1");
    const res = await GET(get("/api/board/meeting-notes/1/links"), makeParams({ type: "meeting-notes", id: "1" }));
    const body = await res.json();
    expect(body.map((t: { id: number }) => t.id)).toEqual([2]);
  });

  it("존재하지 않는 게시글은 404", async () => {
    const res = await GET(get("/api/board/meeting-notes/999/links"), makeParams({ type: "meeting-notes", id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 board_type은 400", async () => {
    const res = await GET(get("/api/board/invalid/1/links"), makeParams({ type: "invalid", id: "1" }));
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/board/[type]/[id]/links", () => {
  it("링크 집합을 교체한다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1)");
    const res = await PUT(put("/api/board/meeting-notes/1/links", { task_ids: [2, 3] }), makeParams({ type: "meeting-notes", id: "1" }));
    expect(res.status).toBe(200);
    const rows = _db.exec("SELECT task_id FROM task_post_links WHERE post_id = 1 ORDER BY task_id");
    expect(rows[0].values).toEqual([[2], [3]]);
  });

  it("삭제된 업무 ID는 400", async () => {
    _db.run("UPDATE tasks SET deleted_at = datetime('now') WHERE id = 2");
    const res = await PUT(put("/api/board/meeting-notes/1/links", { task_ids: [2] }), makeParams({ type: "meeting-notes", id: "1" }));
    expect(res.status).toBe(400);
  });

  it("빈 배열을 보내면 모든 링크가 제거된다", async () => {
    _db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (1, 1), (2, 1)");
    await PUT(put("/api/board/meeting-notes/1/links", { task_ids: [] }), makeParams({ type: "meeting-notes", id: "1" }));
    const rows = _db.exec("SELECT task_id FROM task_post_links WHERE post_id = 1");
    expect(rows[0]?.values?.length ?? 0).toBe(0);
  });

  it("존재하지 않는 게시글은 404", async () => {
    const res = await PUT(put("/api/board/meeting-notes/999/links", { task_ids: [1] }), makeParams({ type: "meeting-notes", id: "999" }));
    expect(res.status).toBe(404);
  });
});
