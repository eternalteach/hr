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
});

describe("GET /api/members", () => {
  it("팀원이 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/members"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("팀원 목록을 반환한다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["홍길동", "hong@test.com"]);
    _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'member')", ["김철수", "kim@test.com"]);
    const res = await GET(get("/api/members"));
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe("POST /api/members", () => {
  it("새 팀원을 생성한다", async () => {
    const res = await POST(post("/api/members", { name: "홍길동", email: "hong@test.com", role: "member" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.name).toBe("홍길동");
  });

  it("이름이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/members", { email: "hong@test.com" }));
    expect(res.status).toBe(400);
  });

  it("이메일이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/members", { name: "홍길동" }));
    expect(res.status).toBe(400);
  });

  it("role이 없으면 기본값 member로 DB에 저장한다", async () => {
    const res = await POST(post("/api/members", { name: "홍길동", email: "hong@test.com" }));
    expect(res.status).toBe(201);
    const dbRow = _db.exec("SELECT role FROM members WHERE email = 'hong@test.com'")[0];
    expect(dbRow.values[0][0]).toBe("member");
  });

  it("잘못된 role은 member로 대체하여 DB에 저장한다", async () => {
    const res = await POST(post("/api/members", { name: "홍길동", email: "hong@test.com", role: "superadmin" }));
    expect(res.status).toBe(201);
    const dbRow = _db.exec("SELECT role FROM members WHERE email = 'hong@test.com'")[0];
    expect(dbRow.values[0][0]).toBe("member");
  });

  it("admin role을 지정할 수 있다", async () => {
    const res = await POST(post("/api/members", { name: "관리자", email: "admin@test.com", role: "admin" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe("admin");
  });
});
