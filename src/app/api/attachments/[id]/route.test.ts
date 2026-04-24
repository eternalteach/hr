import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, del, makeParams } from "@/test/helpers";
import { NextRequest } from "next/server";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

vi.mock("@/lib/attachments/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/attachments/storage")>();
  return {
    ...actual,
    readAttachmentBytes: vi.fn(() => Buffer.from("file content here")),
    deleteAttachment: vi.fn(),
  };
});

import { GET, DELETE } from "./route";


beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, mime_type, size_bytes, uploaded_at) VALUES ('board_post', 1, 'report.pdf', 'db/uploads/board_post/1/1__report.pdf', 'application/pdf', 1024, '2026-04-24T00:00:00.000Z')"
  );
});

describe("GET /api/attachments/[id]", () => {
  it("첨부파일을 다운로드 응답으로 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/attachments/1");
    const res = await GET(req, makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("report.pdf");
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("mime_type이 없으면 application/octet-stream을 사용한다", async () => {
    _db.run(
      "INSERT INTO attachments (owner_type, owner_id, filename, storage_path, size_bytes) VALUES ('board_post', 1, 'noext', 'path', 100)"
    );
    const req = new NextRequest("http://localhost/api/attachments/2");
    const res = await GET(req, makeParams({ id: "2" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/attachments/999");
    const res = await GET(req, makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/attachments/abc");
    const res = await GET(req, makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/attachments/[id]", () => {
  it("첨부파일을 삭제한다", async () => {
    const res = await DELETE(del("/api/attachments/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await DELETE(del("/api/attachments/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/attachments/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
