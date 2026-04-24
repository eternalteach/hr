import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

const validSow = {
  sow_id: "SOW-001",
  lob: "FIN",
  title_local: "재무 SOW",
  title_en: "Finance SOW",
  content_local: "재무 업무 범위",
  content_en: "Finance scope of work",
};

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO sow (sow_id, lob, content_local, content_en) VALUES ('SOW-001', 'FIN', '기존내용', 'existing content')"
  );
});

describe("GET /api/sow", () => {
  it("SOW 목록을 반환한다", async () => {
    const res = await GET(get("/api/sow"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].sow_id).toBe("SOW-001");
  });
});

describe("POST /api/sow", () => {
  it("새 SOW를 생성한다", async () => {
    const res = await POST(post("/api/sow", { ...validSow, sow_id: "SOW-002" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sow_id).toBe("SOW-002");
  });

  it("sow_id가 없으면 400을 반환한다", async () => {
    const { sow_id: _sid, ...rest } = validSow;
    const res = await POST(post("/api/sow", rest));
    expect(res.status).toBe(400);
  });

  it("content_local이 없으면 400을 반환한다", async () => {
    const { content_local: _cl, ...rest } = validSow;
    const res = await POST(post("/api/sow", { ...rest, sow_id: "SOW-002" }));
    expect(res.status).toBe(400);
  });

  it("content_en이 없으면 400을 반환한다", async () => {
    const { content_en: _ce, ...rest } = validSow;
    const res = await POST(post("/api/sow", { ...rest, sow_id: "SOW-002" }));
    expect(res.status).toBe(400);
  });

  it("is_active=N으로 비활성화 생성 가능하다", async () => {
    const res = await POST(post("/api/sow", { ...validSow, sow_id: "SOW-003", is_active: "N" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.is_active).toBe("N");
  });
});
