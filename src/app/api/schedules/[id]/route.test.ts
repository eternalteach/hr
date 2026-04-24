import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, put, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { PUT, DELETE } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO schedules (title, type, start_at) VALUES ('주간회의', 'meeting', '2026-05-01T10:00:00')");
});

describe("PUT /api/schedules/[id]", () => {
  it("일정을 수정한다", async () => {
    const res = await PUT(
      put("/api/schedules/1", { title: "수정된 회의", type: "meeting", start_at: "2026-05-02T10:00:00" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("수정된 회의");
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await PUT(
      put("/api/schedules/999", { title: "없음", type: "meeting", start_at: "2026-05-01" }),
      makeParams({ id: "999" })
    );
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/schedules/abc", { title: "없음", type: "meeting", start_at: "2026-05-01" }),
      makeParams({ id: "abc" })
    );
    expect(res.status).toBe(400);
  });

  it("제목이 없으면 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/schedules/1", { type: "meeting", start_at: "2026-05-01" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("type이 없으면 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/schedules/1", { title: "회의", start_at: "2026-05-01" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("start_at이 없으면 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/schedules/1", { title: "회의", type: "meeting" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/schedules/[id]", () => {
  it("일정을 삭제한다", async () => {
    const res = await DELETE(del("/api/schedules/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await DELETE(del("/api/schedules/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/schedules/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
