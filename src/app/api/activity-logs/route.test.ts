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
  _db.run("INSERT INTO members (name, email, role) VALUES ('관리자', 'admin@test.com', 'admin')");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('업무', 'todo', 'medium', 0)");
});

describe("GET /api/activity-logs", () => {
  it("활동 로그가 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/activity-logs"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("최근 활동 로그를 반환한다", async () => {
    _db.run("INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (1, 1, 'created', '{}')");
    _db.run("INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (1, 1, 'status_changed', '{}')");
    const res = await GET(get("/api/activity-logs"));
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].member_name).toBe("관리자");
    expect(body[0].task_title).toBe("업무");
  });

  it("최대 20건만 반환한다", async () => {
    for (let i = 0; i < 25; i++) {
      _db.run("INSERT INTO activity_logs (task_id, member_id, action) VALUES (1, 1, 'created')");
    }
    const res = await GET(get("/api/activity-logs"));
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(20);
  });
});
