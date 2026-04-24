import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, put, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

vi.mock("@/lib/attachments/storage", () => ({
  deleteAllForOwner: vi.fn(),
}));

import { PUT, DELETE } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO board_posts (board_type, title_local, is_active) VALUES ('glossary', '원본용어', 'Y')");
  _db.run("INSERT INTO board_posts (board_type, title_local, reference_date) VALUES ('meeting-notes', '원본회의', '2026-04-01')");
});

describe("PUT /api/board/[type]/[id]", () => {
  it("glossary 게시글을 수정한다", async () => {
    const res = await PUT(
      put("/api/board/glossary/1", { title_local: "수정된 용어", content_local: "수정된 정의" }),
      makeParams({ type: "glossary", id: "1" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title_local).toBe("수정된 용어");
  });

  it("meeting-notes 게시글을 수정하면 reference_date가 저장된다", async () => {
    const res = await PUT(
      put("/api/board/meeting-notes/2", { title_local: "수정회의", reference_date: "2026-05-10" }),
      makeParams({ type: "meeting-notes", id: "2" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reference_date).toBe("2026-05-10");
  });

  it("존재하지 않는 게시글은 404를 반환한다", async () => {
    const res = await PUT(
      put("/api/board/glossary/999", { title_local: "없음" }),
      makeParams({ type: "glossary", id: "999" })
    );
    expect(res.status).toBe(404);
  });

  it("잘못된 board type은 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/board/invalid/1", { title_local: "없음" }),
      makeParams({ type: "invalid", id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/board/glossary/abc", { title_local: "없음" }),
      makeParams({ type: "glossary", id: "abc" })
    );
    expect(res.status).toBe(400);
  });

  it("title_local이 없으면 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/board/glossary/1", { content_local: "정의" }),
      makeParams({ type: "glossary", id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("타입이 다른 게시글은 404를 반환한다", async () => {
    const res = await PUT(
      put("/api/board/meeting-notes/1", { title_local: "없음" }),
      makeParams({ type: "meeting-notes", id: "1" })
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/board/[type]/[id]", () => {
  it("glossary 게시글을 삭제한다", async () => {
    const res = await DELETE(del("/api/board/glossary/1"), makeParams({ type: "glossary", id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    const remaining = _db.exec("SELECT * FROM board_posts WHERE id = 1");
    expect(remaining[0]?.values?.length ?? 0).toBe(0);
  });

  it("존재하지 않는 게시글은 404를 반환한다", async () => {
    const res = await DELETE(del("/api/board/glossary/999"), makeParams({ type: "glossary", id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 board type은 400을 반환한다", async () => {
    const res = await DELETE(del("/api/board/invalid/1"), makeParams({ type: "invalid", id: "1" }));
    expect(res.status).toBe(400);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/board/glossary/abc"), makeParams({ type: "glossary", id: "abc" }));
    expect(res.status).toBe(400);
  });

  it("타입이 다른 게시글은 404를 반환한다", async () => {
    const res = await DELETE(del("/api/board/meeting-notes/1"), makeParams({ type: "meeting-notes", id: "1" }));
    expect(res.status).toBe(404);
  });
});
