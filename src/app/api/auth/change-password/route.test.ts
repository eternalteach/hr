import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, post } from "@/test/helpers";
import { signSession, COOKIE_NAME } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";
import { NextRequest } from "next/server";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { POST } from "./route";

function makeRequest(token: string, body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify(body),
  });
}

let validToken: string;

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO members (name, email, role, password_hash, must_change_password) VALUES (?, ?, 'admin', ?, 0)",
    ["관리자", "admin@test.com", hashPassword("oldpass123")]
  );
  validToken = await signSession({ sub: 1, role: "admin", mustChange: false });
});

describe("POST /api/auth/change-password", () => {
  it("올바른 현재 비밀번호로 변경에 성공한다", async () => {
    const res = await POST(makeRequest(validToken, { currentPassword: "oldpass123", newPassword: "newpass456" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("taskflow_session");
  });

  it("must_change_password=1인 경우 현재 비밀번호 없이 변경된다", async () => {
    _db.run("UPDATE members SET must_change_password = 1 WHERE id = 1");
    const mustChangeToken = await signSession({ sub: 1, role: "admin", mustChange: true });
    const res = await POST(makeRequest(mustChangeToken, { newPassword: "newpass456" }));
    expect(res.status).toBe(200);
  });

  it("쿠키가 없으면 401을 반환한다", async () => {
    const res = await POST(post("/api/auth/change-password", { currentPassword: "old", newPassword: "newpass456" }));
    expect(res.status).toBe(401);
  });

  it("새 비밀번호가 8자 미만이면 400을 반환한다", async () => {
    const res = await POST(makeRequest(validToken, { currentPassword: "oldpass123", newPassword: "short" }));
    expect(res.status).toBe(400);
  });

  it("현재 비밀번호가 없으면 400을 반환한다 (must_change_password=0인 경우)", async () => {
    const res = await POST(makeRequest(validToken, { newPassword: "newpass456" }));
    expect(res.status).toBe(400);
  });

  it("현재 비밀번호가 틀리면 401을 반환한다", async () => {
    const res = await POST(makeRequest(validToken, { currentPassword: "wrongpass", newPassword: "newpass456" }));
    expect(res.status).toBe(401);
  });

  it("잘못된 토큰은 401을 반환한다", async () => {
    const res = await POST(makeRequest("invalid.token", { currentPassword: "old", newPassword: "newpass456" }));
    expect(res.status).toBe(401);
  });
});
