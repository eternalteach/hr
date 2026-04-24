import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
});

const makeRow = (n: number) => ({
  brd_id: `BRD-${n.toString().padStart(3, "0")}`,
  sow_id: `SOW-001`,
  content_local: `내용${n}`,
  content_en: `content${n}`,
});

describe("POST /api/brd/bulk", () => {
  it("여러 BRD를 한 번에 UPSERT한다", async () => {
    const res = await POST(post("/api/brd/bulk", { rows: [makeRow(1), makeRow(2)] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upserted).toBe(2);
  });

  it("기존 BRD를 업데이트한다 (UPSERT)", async () => {
    _db.run("INSERT INTO brd (brd_id, sow_id, content_local, content_en) VALUES ('BRD-001', 'SOW-001', '원본', 'original')");
    const res = await POST(post("/api/brd/bulk", { rows: [{ brd_id: "BRD-001", sow_id: "SOW-001", content_local: "수정됨", content_en: "updated" }] }));
    expect(res.status).toBe(200);
    const row = _db.exec("SELECT content_local FROM brd WHERE brd_id = 'BRD-001'")[0];
    expect(row.values[0][0]).toBe("수정됨");
  });

  it("rows가 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/brd/bulk", {}));
    expect(res.status).toBe(400);
  });

  it("rows가 빈 배열이면 400을 반환한다", async () => {
    const res = await POST(post("/api/brd/bulk", { rows: [] }));
    expect(res.status).toBe(400);
  });
});
