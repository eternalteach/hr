import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get } from "@/test/helpers";
import { COOKIE_NAME } from "@/lib/session";
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

vi.mock("@/lib/attachments/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/attachments/storage")>();
  return {
    ...actual,
    saveAttachment: vi.fn(() => ({
      id: 1,
      owner_type: "board_post",
      owner_id: 1,
      filename: "test.pdf",
      storage_path: "db/uploads/board_post/1/1__test.pdf",
      mime_type: "application/pdf",
      size_bytes: 1024,
      uploaded_by: null,
      uploaded_at: new Date().toISOString(),
    })),
  };
});

import { GET, POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _cookiesStore = {};
  _db.run("INSERT INTO board_posts (board_type, title_local) VALUES ('glossary', '테스트 용어')");
  _db.run(
    "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'doc.pdf', 'some/path', 1000)"
  );
});

describe("GET /api/attachments", () => {
  it("owner의 첨부파일 목록을 반환한다", async () => {
    const res = await GET(get("/api/attachments", { owner_type: "board_post", owner_id: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].filename).toBe("doc.pdf");
  });

  it("잘못된 owner_type은 400을 반환한다", async () => {
    const res = await GET(get("/api/attachments", { owner_type: "invalid", owner_id: "1" }));
    expect(res.status).toBe(400);
  });

  it("owner_type이 없으면 400을 반환한다", async () => {
    const res = await GET(get("/api/attachments", { owner_id: "1" }));
    expect(res.status).toBe(400);
  });

  it("잘못된 owner_id는 400을 반환한다", async () => {
    const res = await GET(get("/api/attachments", { owner_type: "board_post", owner_id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("owner_id가 0이면 400을 반환한다", async () => {
    const res = await GET(get("/api/attachments", { owner_type: "board_post", owner_id: "0" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/attachments", () => {
  function makeUploadRequest(fields: Record<string, string | File>, cookieToken?: string): NextRequest {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    return new NextRequest("http://localhost/api/attachments", {
      method: "POST",
      headers: cookieToken ? { Cookie: `${COOKIE_NAME}=${cookieToken}` } : {},
      body: formData,
    });
  }

  it("파일을 업로드한다", async () => {
    const file = new File(["hello world"], "test.txt", { type: "text/plain" });
    const res = await POST(makeUploadRequest({ owner_type: "board_post", owner_id: "1", file }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].filename).toBe("test.pdf");
  });

  it("대상 게시글이 없으면 404를 반환한다", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const res = await POST(makeUploadRequest({ owner_type: "board_post", owner_id: "999", file }));
    expect(res.status).toBe(404);
  });

  it("파일이 없으면 400을 반환한다", async () => {
    const res = await POST(makeUploadRequest({ owner_type: "board_post", owner_id: "1" }));
    expect(res.status).toBe(400);
  });

  it("잘못된 owner_type은 400을 반환한다", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const res = await POST(makeUploadRequest({ owner_type: "invalid", owner_id: "1", file }));
    expect(res.status).toBe(400);
  });

  it("빈 파일은 400을 반환한다", async () => {
    const file = new File([], "empty.txt", { type: "text/plain" });
    const res = await POST(makeUploadRequest({ owner_type: "board_post", owner_id: "1", file }));
    expect(res.status).toBe(400);
  });

  it("최대 파일 크기 초과 시 400을 반환한다", async () => {
    const bigContent = new Uint8Array(21 * 1024 * 1024);
    const file = new File([bigContent], "huge.bin", { type: "application/octet-stream" });
    const res = await POST(makeUploadRequest({ owner_type: "board_post", owner_id: "1", file }));
    expect(res.status).toBe(400);
  });
});
