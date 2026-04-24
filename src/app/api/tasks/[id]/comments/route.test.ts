import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, makeParams } from "@/test/helpers";
import { signSession, COOKIE_NAME } from "@/lib/session";
import { NextRequest } from "next/server";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;
let _cookiesStore: Record<string, string> = {};

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => _cookiesStore[name] ? { value: _cookiesStore[name] } : undefined,
  })),
}));

import { GET, POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _cookiesStore = {};
  _db.run("INSERT INTO members (name, email, role) VALUES ('관리자', 'admin@test.com', 'admin')");
  _db.run("INSERT INTO tasks (title, status, priority, position, created_by) VALUES ('테스트업무', 'todo', 'medium', 0, 1)");
});

function makePostRequest(body: unknown, token?: string): NextRequest {
  const cookieHeader = token ? `${COOKIE_NAME}=${token}` : "";
  return new NextRequest("http://localhost/api/tasks/1/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/tasks/[id]/comments", () => {
  it("댓글 목록을 반환한다", async () => {
    _db.run("INSERT INTO comments (task_id, member_id, content) VALUES (1, 1, '첫 댓글')");
    _db.run("INSERT INTO comments (task_id, member_id, content) VALUES (1, 1, '두 번째 댓글')");
    const res = await GET(get("/api/tasks/1/comments"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].member).toBeDefined();
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await GET(get("/api/tasks/abc/comments"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks/[id]/comments", () => {
  it("댓글을 생성한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    _cookiesStore[COOKIE_NAME] = token;
    const res = await POST(makePostRequest({ content: "새 댓글입니다" }), makeParams({ id: "1" }));
    expect(res.status).toBe(201);
    const comments = _db.exec("SELECT * FROM comments WHERE task_id = 1");
    expect(comments[0]?.values?.length).toBe(1);
  });

  it("activity_log가 생성된다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    _cookiesStore[COOKIE_NAME] = token;
    await POST(makePostRequest({ content: "댓글" }), makeParams({ id: "1" }));
    const logs = _db.exec("SELECT * FROM activity_logs WHERE action = 'commented'");
    expect(logs[0]?.values?.length).toBe(1);
  });

  it("세션 없이 댓글 작성 시 401을 반환한다", async () => {
    const res = await POST(makePostRequest({ content: "댓글" }), makeParams({ id: "1" }));
    expect(res.status).toBe(401);
  });

  it("content가 없으면 400을 반환한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    _cookiesStore[COOKIE_NAME] = token;
    const res = await POST(makePostRequest({}), makeParams({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    _cookiesStore[COOKIE_NAME] = token;
    const res = await POST(makePostRequest({ content: "댓글" }), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
