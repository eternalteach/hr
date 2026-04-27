import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, patch, del, makeParams } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { PATCH, DELETE } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO llm_configs (id, name, provider, api_key, is_default) VALUES (1, 'Test LLM', 'openai', 'key1', 'N')"
  );
  _db.run(
    "INSERT INTO llm_configs (id, name, provider, api_key, is_default) VALUES (2, 'Default LLM', 'anthropic', 'key2', 'Y')"
  );
});

describe("PATCH /api/settings/llm/[id]", () => {
  it("LLM 설정을 수정한다", async () => {
    const res = await PATCH(patch("/api/settings/llm/1", { name: "Updated Name" }), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    
    const rows = _db.exec("SELECT name FROM llm_configs WHERE id = 1");
    expect(rows[0].values[0][0]).toBe("Updated Name");
  });

  it("is_default=Y로 수정 시 기존 기본값을 해제한다", async () => {
    await PATCH(patch("/api/settings/llm/1", { is_default: "Y" }), makeParams({ id: "1" }));
    
    const rows = _db.exec("SELECT id, is_default FROM llm_configs ORDER BY id ASC");
    // ID 1 -> Y
    // ID 2 -> N
    expect(rows[0].values[0][1]).toBe("Y");
    expect(rows[0].values[1][1]).toBe("N");
  });

  it("존재하지 않는 ID면 404를 반환한다", async () => {
    const res = await PATCH(patch("/api/settings/llm/999", { name: "X" }), makeParams({ id: "999" }));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/settings/llm/[id]", () => {
  it("LLM 설정을 삭제한다", async () => {
    const res = await DELETE(del("/api/settings/llm/1"), makeParams({ id: "1" }));
    expect(res.status).toBe(200);
    
    const rows = _db.exec("SELECT COUNT(*) FROM llm_configs WHERE id = 1");
    expect(rows[0].values[0][0]).toBe(0);
  });
});
