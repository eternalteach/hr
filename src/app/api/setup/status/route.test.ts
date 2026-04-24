import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get } from "@/test/helpers";
import { hashPassword } from "@/lib/crypto";
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

describe("GET /api/setup/status", () => {
  it("관리자가 없으면 needsSetup: true를 반환한다", async () => {
    const res = await GET(get("/api/setup/status"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ needsSetup: true });
  });

  it("password_hash가 없는 관리자는 needsSetup: true를 반환한다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES ('관리자', 'admin@test.com', 'admin')");
    const res = await GET(get("/api/setup/status"));
    expect(await res.json()).toEqual({ needsSetup: true });
  });

  it("관리자가 있으면 needsSetup: false를 반환한다", async () => {
    _db.run(
      "INSERT INTO members (name, email, role, password_hash) VALUES ('관리자', 'admin@test.com', 'admin', ?)",
      [hashPassword("password")]
    );
    const res = await GET(get("/api/setup/status"));
    expect(await res.json()).toEqual({ needsSetup: false });
  });
});
