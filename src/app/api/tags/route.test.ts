import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
});

describe("GET /api/tags", () => {
  it("태그가 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/tags"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("태그 목록을 반환한다", async () => {
    _db.run("INSERT INTO tags (name, color) VALUES ('기획', '#ff0000')");
    _db.run("INSERT INTO tags (name, color) VALUES ('개발', '#00ff00')");
    const res = await GET(get("/api/tags"));
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("기획");
  });
});
