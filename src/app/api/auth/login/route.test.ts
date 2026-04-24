import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";
import { hashPassword } from "@/lib/crypto";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO members (name, email, role, password_hash, must_change_password) VALUES (?, ?, 'admin', ?, 0)",
    ["관리자", "admin@test.com", hashPassword("password123")]
  );
});

describe("POST /api/auth/login", () => {
  it("올바른 자격증명으로 로그인하면 쿠키가 설정된다", async () => {
    const res = await POST(post("/api/auth/login", { email: "admin@test.com", password: "password123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("taskflow_session");
  });

  it("must_change_password=1인 경우 mustChange: true를 반환한다", async () => {
    _db.run(
      "INSERT INTO members (name, email, role, password_hash, must_change_password) VALUES (?, ?, 'member', ?, 1)",
      ["신규", "new@test.com", hashPassword("pass1234")]
    );
    const res = await POST(post("/api/auth/login", { email: "new@test.com", password: "pass1234" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mustChange).toBe(true);
  });

  it("이메일이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/auth/login", { password: "password123" }));
    expect(res.status).toBe(400);
  });

  it("비밀번호가 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/auth/login", { email: "admin@test.com" }));
    expect(res.status).toBe(400);
  });

  it("존재하지 않는 이메일은 401을 반환한다", async () => {
    const res = await POST(post("/api/auth/login", { email: "nobody@test.com", password: "password123" }));
    expect(res.status).toBe(401);
  });

  it("비밀번호가 틀리면 401을 반환한다", async () => {
    const res = await POST(post("/api/auth/login", { email: "admin@test.com", password: "wrongpassword" }));
    expect(res.status).toBe(401);
  });

  it("password_hash가 없는 계정은 401을 반환한다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'member')", ["노해시", "nohash@test.com"]);
    const res = await POST(post("/api/auth/login", { email: "nohash@test.com", password: "anything" }));
    expect(res.status).toBe(401);
  });
});
