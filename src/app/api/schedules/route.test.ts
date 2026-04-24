import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('주간회의', 'meeting', '2026-05-01T10:00:00')");
  _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('마감', 'deadline', '2026-05-10T09:00:00')");
});

describe("GET /api/schedules", () => {
  it("일정 목록을 반환한다", async () => {
    const res = await GET(get("/api/schedules"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("from 필터로 시작 시간 이후만 반환한다", async () => {
    const res = await GET(get("/api/schedules", { from: "2026-05-05T00:00:00" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("마감");
  });

  it("to 필터로 시작 시간 이전만 반환한다", async () => {
    const res = await GET(get("/api/schedules", { to: "2026-05-05T00:00:00" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("주간회의");
  });

  it("from + to 범위 필터", async () => {
    const res = await GET(get("/api/schedules", { from: "2026-04-01", to: "2026-05-31" }));
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe("POST /api/schedules", () => {
  it("새 일정을 생성한다", async () => {
    const res = await POST(post("/api/schedules", {
      title: "새 회의",
      type: "meeting",
      start_at: "2026-06-01T10:00:00",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("새 회의");
  });

  it("제목이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/schedules", { type: "meeting", start_at: "2026-06-01" }));
    expect(res.status).toBe(400);
  });

  it("type이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/schedules", { title: "회의", start_at: "2026-06-01" }));
    expect(res.status).toBe(400);
  });

  it("start_at이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/schedules", { title: "회의", type: "meeting" }));
    expect(res.status).toBe(400);
  });

  it("선택 필드를 포함하여 생성한다", async () => {
    const res = await POST(post("/api/schedules", {
      title: "장소있는 회의",
      type: "meeting",
      start_at: "2026-06-01T10:00:00",
      end_at: "2026-06-01T11:00:00",
      location: "회의실 A",
      created_by: 1,
    }));
    expect(res.status).toBe(201);
  });
});
