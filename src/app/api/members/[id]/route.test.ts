import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, put, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { PUT, DELETE } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["관리자", "admin@test.com"]);
  _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'member')", ["팀원", "member@test.com"]);
});

describe("PUT /api/members/[id]", () => {
  it("팀원 정보를 수정한다 — name_en 포함", async () => {
    const res = await PUT(put("/api/members/2", { name: "수정팀원", name_en: "Edited", email: "updated@test.com", role: "leader" }), makeParams({ id: "2" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("수정팀원");
    expect(body.name_en).toBe("Edited");
    expect(body.role).toBe("leader");
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await PUT(put("/api/members/999", { name: "없음", name_en: "X", email: "none@test.com" }), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PUT(put("/api/members/abc", { name: "없음", name_en: "X", email: "none@test.com" }), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("이름이 없으면 400을 반환한다", async () => {
    const res = await PUT(put("/api/members/2", { name_en: "X", email: "a@test.com" }), makeParams({ id: "2" }));
    expect(res.status).toBe(400);
  });

  it("이메일이 없으면 400을 반환한다", async () => {
    const res = await PUT(put("/api/members/2", { name: "팀원", name_en: "Member" }), makeParams({ id: "2" }));
    expect(res.status).toBe(400);
  });

  it("name_en이 없으면 400 NAME_EN_REQUIRED를 반환한다", async () => {
    const res = await PUT(put("/api/members/2", { name: "팀원", email: "m@test.com" }), makeParams({ id: "2" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("NAME_EN_REQUIRED");
  });

  it("마지막 관리자 역할 변경을 차단한다", async () => {
    const res = await PUT(
      put("/api/members/1", { name: "관리자", name_en: "Admin", email: "admin@test.com", role: "member" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("마지막 관리자");
  });

  it("관리자가 2명이면 한 명의 역할 변경 가능하다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["관리자2", "admin2@test.com"]);
    const res = await PUT(
      put("/api/members/1", { name: "관리자", name_en: "Admin", email: "admin@test.com", role: "member" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/members/[id]", () => {
  it("팀원을 삭제한다", async () => {
    const res = await DELETE(del("/api/members/2"), makeParams({ id: "2" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await DELETE(del("/api/members/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/members/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("마지막 관리자 삭제를 차단한다", async () => {
    const res = await DELETE(del("/api/members/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("마지막 관리자");
  });

  it("관리자가 2명이면 한 명 삭제 가능하다", async () => {
    _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["관리자2", "admin2@test.com"]);
    const res = await DELETE(del("/api/members/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
  });
});
