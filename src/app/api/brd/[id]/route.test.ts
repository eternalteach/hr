import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, put, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { PUT, DELETE } from "./route";

const validBody = {
  brd_id: "BRD-001",
  sow_id: "SOW-001",
  content_local: "수정된 내용",
  content_en: "updated content",
};

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO brd (brd_id, sow_id, content_local, content_en) VALUES ('BRD-001', 'SOW-001', '원본', 'original')");
});

describe("PUT /api/brd/[id]", () => {
  it("BRD를 수정한다", async () => {
    const res = await PUT(put("/api/brd/1", validBody), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content_local).toBe("수정된 내용");
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await PUT(put("/api/brd/999", validBody), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PUT(put("/api/brd/abc", validBody), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("brd_id가 없으면 400을 반환한다", async () => {
    const { brd_id: _bid, ...rest } = validBody;
    const res = await PUT(put("/api/brd/1", rest), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("sow_id가 없으면 400을 반환한다", async () => {
    const { sow_id: _sid, ...rest } = validBody;
    const res = await PUT(put("/api/brd/1", rest), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("content_local이 없으면 400을 반환한다", async () => {
    const { content_local: _cl, ...rest } = validBody;
    const res = await PUT(put("/api/brd/1", rest), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("content_en이 없으면 400을 반환한다", async () => {
    const { content_en: _ce, ...rest } = validBody;
    const res = await PUT(put("/api/brd/1", rest), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/brd/[id]", () => {
  it("BRD를 삭제한다", async () => {
    const res = await DELETE(del("/api/brd/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await DELETE(del("/api/brd/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/brd/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
