import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, patch, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, PATCH, DELETE } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["관리자", "admin@test.com"]);
  _db.run("INSERT INTO tasks (title, status, priority, position, created_by) VALUES (?, 'todo', 'medium', 0, 1)", ["테스트업무"]);
});

describe("GET /api/tasks/[id]", () => {
  it("업무 상세를 반환한다", async () => {
    const res = await GET(get("/api/tasks/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("테스트업무");
  });

  it("존재하지 않는 업무는 404를 반환한다", async () => {
    const res = await GET(get("/api/tasks/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("삭제된 업무는 404를 반환한다", async () => {
    _db.run("UPDATE tasks SET deleted_at = datetime('now') WHERE id = 1");
    const res = await GET(get("/api/tasks/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await GET(get("/api/tasks/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tasks/[id]", () => {
  it("업무를 수정한다", async () => {
    const res = await PATCH(patch("/api/tasks/1", { title: "수정된 업무", priority: "high" }), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("수정된 업무");
    expect(body.priority).toBe("high");
  });

  it("status를 done으로 변경하면 completed_at이 설정된다", async () => {
    const res = await PATCH(patch("/api/tasks/1", { status: "done" }), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed_at).not.toBeNull();
  });

  it("done에서 다른 상태로 변경하면 completed_at이 null이 된다", async () => {
    _db.run("UPDATE tasks SET status = 'done', completed_at = datetime('now') WHERE id = 1");
    const res = await PATCH(patch("/api/tasks/1", { status: "in_progress" }), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed_at).toBeNull();
  });

  it("상태 변경 시 activity_log가 생성된다", async () => {
    await PATCH(patch("/api/tasks/1", { status: "in_progress" }), makeParams({ id: "1" }));
    const logs = _db.exec("SELECT * FROM activity_logs WHERE action = 'status_changed'");
    expect(logs[0]?.values?.length).toBe(1);
  });

  it("due_date 변경 시 스케줄이 업데이트된다", async () => {
    await PATCH(patch("/api/tasks/1", { due_date: "2026-06-01" }), makeParams({ id: "1" }));
    const schedules = _db.exec("SELECT * FROM schedules WHERE task_id = 1 AND type = 'deadline'");
    expect(schedules[0]?.values?.length).toBe(1);
  });

  it("due_date를 null로 변경하면 스케줄이 삭제된다", async () => {
    _db.run("INSERT INTO schedules (title, type, start_at, task_id) VALUES ('마감', 'deadline', '2026-05-01', 1)");
    await PATCH(patch("/api/tasks/1", { due_date: null }), makeParams({ id: "1" }));
    const schedules = _db.exec("SELECT * FROM schedules WHERE task_id = 1 AND type = 'deadline'");
    expect(schedules[0]?.values?.length ?? 0).toBe(0);
  });

  it("assignee_ids를 교체한다", async () => {
    _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1)");
    _db.run("INSERT INTO members (name, email, role) VALUES ('팀원', 'member@test.com', 'member')");
    await PATCH(patch("/api/tasks/1", { assignee_ids: [2] }), makeParams({ id: "1" }));
    const assignees = _db.exec("SELECT member_id FROM task_assignees WHERE task_id = 1");
    expect(assignees[0].values).toEqual([[2]]);
  });

  it("존재하지 않는 업무는 404를 반환한다", async () => {
    const res = await PATCH(patch("/api/tasks/999", { title: "없음" }), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PATCH(patch("/api/tasks/abc", { title: "없음" }), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/[id]", () => {
  it("업무를 소프트 삭제한다", async () => {
    const res = await DELETE(del("/api/tasks/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
    const row = _db.exec("SELECT deleted_at FROM tasks WHERE id = 1")[0];
    expect(row.values[0][0]).not.toBeNull();
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/tasks/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
