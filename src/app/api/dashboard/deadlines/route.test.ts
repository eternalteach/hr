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

describe("GET /api/dashboard/deadlines", () => {
  it("마감 예정 업무가 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/dashboard/deadlines"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("7일 이내 마감 업무를 반환한다", async () => {
    _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES ('마감임박', 'todo', 'medium', 0, date('now', '+3 days'))");
    _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES ('먼미래', 'todo', 'medium', 0, date('now', '+30 days'))");
    _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES ('완료됨', 'done', 'medium', 0, date('now', '+3 days'))");
    const res = await GET(get("/api/dashboard/deadlines"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("마감임박");
  });

  it("최대 10건만 반환한다", async () => {
    for (let i = 0; i < 15; i++) {
      _db.run("INSERT INTO tasks (title, status, priority, position, due_date) VALUES (?, 'todo', 'medium', 0, date('now', '+1 days'))", [`업무${i}`]);
    }
    const res = await GET(get("/api/dashboard/deadlines"));
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(10);
  });
});
