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
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('긴급1', 'todo', 'urgent', 0)");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('긴급2', 'in_progress', 'urgent', 0)");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('일반', 'todo', 'medium', 0)");
  _db.run("INSERT INTO tasks (title, status, priority, position, deleted_at) VALUES ('삭제', 'todo', 'high', 0, datetime('now'))");
});

describe("GET /api/dashboard/priority", () => {
  it("우선순위별 업무 수를 반환한다", async () => {
    const res = await GET(get("/api/dashboard/priority"));
    expect(res.status).toBe(200);
    const body = await res.json();
    const urgentRow = body.find((r: { priority: string }) => r.priority === "urgent");
    const mediumRow = body.find((r: { priority: string }) => r.priority === "medium");
    expect(urgentRow.count).toBe(2);
    expect(mediumRow.count).toBe(1);
  });

  it("삭제된 업무는 집계에서 제외된다", async () => {
    const res = await GET(get("/api/dashboard/priority"));
    const body = await res.json();
    const highRow = body.find((r: { priority: string }) => r.priority === "high");
    expect(highRow).toBeUndefined();
  });
});
