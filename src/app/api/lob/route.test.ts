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
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('LOB', 'IT', 'IT')");
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('OTHER', 'X01', '기타')");
});

describe("GET /api/lob", () => {
  it("LOB 코드만 반환한다", async () => {
    const res = await GET(get("/api/lob"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    body.forEach((row: { code_group: string }) => expect(row.code_group).toBe("LOB"));
  });
});

describe("POST /api/lob", () => {
  it("새 LOB를 생성한다", async () => {
    const res = await POST(post("/api/lob", { code: "HR", title_local: "인사", title_en: "HR" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.code).toBe("HR");
    expect(body.code_group).toBe("LOB");
  });

  it("코드가 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/lob", { title_local: "인사" }));
    expect(res.status).toBe(400);
  });
});
