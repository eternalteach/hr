import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO board_posts (board_type, title_local) VALUES ('glossary', '매출채권')");
  _db.run("INSERT INTO board_posts (board_type, lob, title_local, reference_date) VALUES ('meeting-notes', 'FIN', '재무회의', '2026-04-01')");
});

describe("GET /api/board/[type]", () => {
  it("glossary 게시글 목록을 반환한다", async () => {
    const res = await GET(get("/api/board/glossary"), makeParams({ type: "glossary" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].board_type).toBe("glossary");
  });

  it("meeting-notes 게시글 목록을 반환한다", async () => {
    const res = await GET(get("/api/board/meeting-notes"), makeParams({ type: "meeting-notes" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].board_type).toBe("meeting-notes");
  });

  it("lob 필터로 필터링한다", async () => {
    const res = await GET(
      get("/api/board/meeting-notes", { lob: "FIN" }),
      makeParams({ type: "meeting-notes" })
    );
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].lob).toBe("FIN");
  });

  it("잘못된 board type은 400을 반환한다", async () => {
    const res = await GET(get("/api/board/invalid-type"), makeParams({ type: "invalid-type" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/board/[type]", () => {
  it("glossary 게시글을 생성한다", async () => {
    const res = await POST(
      post("/api/board/glossary", { title_local: "매출총이익", content_local: "정의 내용" }),
      makeParams({ type: "glossary" })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.board_type).toBe("glossary");
    expect(body.title_local).toBe("매출총이익");
  });

  it("meeting-notes 게시글에 reference_date를 저장한다", async () => {
    const res = await POST(
      post("/api/board/meeting-notes", {
        title_local: "Q2 킥오프",
        reference_date: "2026-05-01",
        lob: "IT",
      }),
      makeParams({ type: "meeting-notes" })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reference_date).toBe("2026-05-01");
  });

  it("glossary에서 reference_date는 무시된다", async () => {
    const res = await POST(
      post("/api/board/glossary", { title_local: "용어", reference_date: "2026-05-01" }),
      makeParams({ type: "glossary" })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reference_date).toBeNull();
  });

  it("title_local이 없으면 400을 반환한다", async () => {
    const res = await POST(
      post("/api/board/glossary", { content_local: "정의" }),
      makeParams({ type: "glossary" })
    );
    expect(res.status).toBe(400);
  });

  it("잘못된 board type은 400을 반환한다", async () => {
    const res = await POST(
      post("/api/board/invalid", { title_local: "제목" }),
      makeParams({ type: "invalid" })
    );
    expect(res.status).toBe(400);
  });
});
