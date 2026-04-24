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
  _db.run("INSERT INTO members (name, email, role) VALUES ('홍길동', 'hong@test.com', 'member')");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('완료업무', 'done', 'medium', 0)");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('진행업무', 'in_progress', 'medium', 0)");
  _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1)");
  _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (2, 1)");
});

describe("GET /api/dashboard/workload", () => {
  it("팀원별 업무 부하를 반환한다", async () => {
    const res = await GET(get("/api/dashboard/workload"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("홍길동");
    expect(body[0].completed).toBe(1);
    expect(body[0].in_progress).toBe(1);
  });

  it("팀원이 없으면 빈 배열을 반환한다", async () => {
    _db.run("DELETE FROM task_assignees");
    _db.run("DELETE FROM members");
    const res = await GET(get("/api/dashboard/workload"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
