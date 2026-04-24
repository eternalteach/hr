import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get } from "@/test/helpers";
import { signSession, COOKIE_NAME } from "@/lib/session";
import { NextRequest } from "next/server";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET } from "./route";

function makeAuthRequest(token: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/me", {
    method: "GET",
    headers: { Cookie: `${COOKIE_NAME}=${token}` },
  });
}

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO members (name, email, role, must_change_password) VALUES (?, ?, 'admin', 0)",
    ["관리자", "admin@test.com"]
  );
});

describe("GET /api/auth/me", () => {
  it("유효한 세션 쿠키가 있으면 사용자 정보를 반환한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    const res = await GET(makeAuthRequest(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("admin@test.com");
    expect(body.password_hash).toBeUndefined();
  });

  it("쿠키가 없으면 401을 반환한다", async () => {
    const res = await GET(get("/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("잘못된 토큰은 401을 반환한다", async () => {
    const res = await GET(makeAuthRequest("invalid.token"));
    expect(res.status).toBe(401);
  });

  it("존재하지 않는 사용자 ID의 토큰은 401을 반환한다", async () => {
    const token = await signSession({ sub: 9999, role: "admin", mustChange: false });
    const res = await GET(makeAuthRequest(token));
    expect(res.status).toBe(401);
  });
});
