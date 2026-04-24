import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
});

describe("GET /api/dashboard/summary", () => {
  it("업무가 없으면 모두 0을 반환한다", async () => {
    const res = await GET(get("/api/dashboard/summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ totalTasks: 0, inProgress: 0, completedThisWeek: 0, overdue: 0 });
  });

  it("총 업무 수를 반환한다", async () => {
    _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('A', 'todo', 'medium', 0)");
    _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('B', 'in_progress', 'medium', 0)");
    _db.run("INSERT INTO tasks (title, status, priority, position, deleted_at) VALUES ('C', 'todo', 'low', 0, datetime('now'))");
    const res = await GET(get("/api/dashboard/summary"));
    const body = await res.json();
    expect(body.totalTasks).toBe(2);
  });

  it("진행 중 업무 수를 반환한다", async () => {
    _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('A', 'in_progress', 'medium', 0)");
    _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('B', 'review', 'medium', 0)");
    _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('C', 'done', 'medium', 0)");
    const res = await GET(get("/api/dashboard/summary"));
    const body = await res.json();
    expect(body.inProgress).toBe(2);
  });

  it("기간 초과 업무 수를 반환한다", async () => {
    _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES ('지연', 'todo', 'medium', 0, date('now', '-1 days'))");
    _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES ('완료됨', 'done', 'medium', 0, date('now', '-1 days'))");
    const res = await GET(get("/api/dashboard/summary"));
    const body = await res.json();
    expect(body.overdue).toBe(1);
  });
});
