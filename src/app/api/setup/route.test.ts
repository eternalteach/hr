import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, post } from "@/test/helpers";
import { hashPassword } from "@/lib/crypto";
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

describe("POST /api/setup", () => {
  it("최초 관리자 계정을 생성한다", async () => {
    const res = await POST(post("/api/setup", {
      name: "관리자",
      email: "admin@test.com",
      password: "password123",
    }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true });
    const member = _db.exec("SELECT * FROM members WHERE email = 'admin@test.com'")[0];
    expect(member.values).toHaveLength(1);
  });

  it("이미 관리자가 있으면 403을 반환한다", async () => {
    _db.run(
      "INSERT INTO members (name, email, role, password_hash) VALUES ('기존', 'existing@test.com', 'admin', ?)",
      [hashPassword("password")]
    );
    const res = await POST(post("/api/setup", {
      name: "신규",
      email: "new@test.com",
      password: "password123",
    }));
    expect(res.status).toBe(403);
  });

  it("이름이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/setup", { email: "admin@test.com", password: "password123" }));
    expect(res.status).toBe(400);
  });

  it("이메일이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/setup", { name: "관리자", password: "password123" }));
    expect(res.status).toBe(400);
  });

  it("비밀번호가 8자 미만이면 400을 반환한다", async () => {
    const res = await POST(post("/api/setup", { name: "관리자", email: "admin@test.com", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("중복 이메일이면 409를 반환한다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES ('기존멤버', 'admin@test.com', 'member')");
    const res = await POST(post("/api/setup", {
      name: "관리자",
      email: "admin@test.com",
      password: "password123",
    }));
    expect(res.status).toBe(409);
  });
});
