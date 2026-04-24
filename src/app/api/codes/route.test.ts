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
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('LOB', 'FIN', '재무')");
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('TYPE', 'A', '유형A')");
});

describe("GET /api/codes", () => {
  it("모든 공통코드를 반환한다", async () => {
    const res = await GET(get("/api/codes"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("group 필터로 해당 그룹만 반환한다", async () => {
    const res = await GET(get("/api/codes", { group: "LOB" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].code_group).toBe("LOB");
  });
});

describe("POST /api/codes", () => {
  it("새 공통코드를 생성한다", async () => {
    const res = await POST(post("/api/codes", { code_group: "DEPT", code: "DEV", title_local: "개발부" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.code).toBe("DEV");
  });

  it("그룹이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/codes", { code: "DEV" }));
    expect(res.status).toBe(400);
  });

  it("코드가 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/codes", { code_group: "DEPT" }));
    expect(res.status).toBe(400);
  });

  it("중복 코드는 409를 반환한다", async () => {
    const res = await POST(post("/api/codes", { code_group: "LOB", code: "FIN" }));
    expect(res.status).toBe(409);
  });
});
