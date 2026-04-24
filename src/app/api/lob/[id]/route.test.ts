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
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('LOB', 'FIN', '재무')");
  _db.run("INSERT INTO common_codes (code_group, code, title_local) VALUES ('LOB', 'IT', 'IT')");
});

describe("PUT /api/lob/[id]", () => {
  it("LOB를 수정한다", async () => {
    const res = await PUT(
      put("/api/lob/1", { code: "FIN", title_local: "재무수정", title_en: "Finance" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title_local).toBe("재무수정");
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await PUT(
      put("/api/lob/999", { code: "XX" }),
      makeParams({ id: "999" })
    );
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/lob/abc", { code: "XX" }),
      makeParams({ id: "abc" })
    );
    expect(res.status).toBe(400);
  });

  it("코드가 없으면 400을 반환한다", async () => {
    const res = await PUT(
      put("/api/lob/1", { title_local: "재무" }),
      makeParams({ id: "1" })
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/lob/[id]", () => {
  it("LOB를 삭제한다", async () => {
    const res = await DELETE(del("/api/lob/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("존재하지 않는 ID는 404를 반환한다", async () => {
    const res = await DELETE(del("/api/lob/999"), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });

  it("잘못된 ID는 400을 반환한다", async () => {
    const res = await DELETE(del("/api/lob/abc"), makeParams({ id: "abc" }));
    expect(res.status).toBe(400);
  });
});
