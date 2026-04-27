import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

const validBrd = {
  brd_id: "BRD-001",
  sow_id: "SOW-001",
  lob: "FIN",
  title_local: "재무 BRD",
  title_en: "Finance BRD",
  content_local: "재무 요구사항",
  content_en: "Finance requirements",
};

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO brd (brd_id, sow_id, content_local, content_en) VALUES ('BRD-001', 'SOW-001', '기존', 'existing')");
});

describe("GET /api/brd", () => {
  it("BRD 목록을 반환한다", async () => {
    const res = await GET(get("/api/brd"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].brd_id).toBe("BRD-001");
  });
});

describe("POST /api/brd", () => {
  it("새 BRD를 생성한다", async () => {
    const res = await POST(post("/api/brd", { ...validBrd, brd_id: "BRD-002" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.brd_id).toBe("BRD-002");
  });

  it("brd_id가 없으면 400을 반환한다", async () => {
    const { brd_id: _brd_id, ...rest } = validBrd;
    const res = await POST(post("/api/brd", rest));
    expect(res.status).toBe(400);
  });

  it("sow_id가 없으면 400을 반환한다", async () => {
    const { sow_id: _sow_id, ...rest } = validBrd;
    const res = await POST(post("/api/brd", { ...rest, brd_id: "BRD-002" }));
    expect(res.status).toBe(400);
  });

  it("content_local이 없으면 400을 반환한다 (data_language가 local일 때)", async () => {
    const { content_local: _cl, ...rest } = validBrd;
    const res = await POST(post("/api/brd", { ...rest, brd_id: "BRD-002", data_language: "local" }));
    expect(res.status).toBe(400);
  });

  it("content_en이 없으면 400을 반환한다 (data_language가 en일 때)", async () => {
    const { content_en: _ce, ...rest } = validBrd;
    const res = await POST(post("/api/brd", { ...rest, brd_id: "BRD-002", data_language: "en" }));
    expect(res.status).toBe(400);
  });

  it("is_active=N으로 비활성화 생성 가능하다", async () => {
    const res = await POST(post("/api/brd", { ...validBrd, brd_id: "BRD-003", is_active: "N" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.is_active).toBe("N");
  });
});
