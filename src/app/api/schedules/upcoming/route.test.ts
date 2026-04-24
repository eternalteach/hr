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

describe("GET /api/schedules/upcoming", () => {
  it("일정이 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/schedules/upcoming"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("7일 이내 일정을 반환한다", async () => {
    _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('오늘 회의', 'meeting', date('now', '+1 days'))");
    _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('먼 미래', 'meeting', date('now', '+30 days'))");
    _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('과거', 'meeting', date('now', '-1 days'))");
    const res = await GET(get("/api/schedules/upcoming"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("오늘 회의");
  });

  it("최대 10건만 반환한다", async () => {
    for (let i = 0; i < 15; i++) {
      _db.run("INSERT INTO schedules (title, type, start_at) VALUES (?, 'meeting', date('now', '+1 days'))", [`회의${i}`]);
    }
    const res = await GET(get("/api/schedules/upcoming"));
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(10);
  });
});
