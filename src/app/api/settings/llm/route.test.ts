import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

const validLlm = {
  name: "OpenAI GPT-4",
  provider: "openai",
  api_key: "sk-test-key",
  model: "gpt-4",
  is_default: "N",
};

beforeEach(async () => {
  _db = await createTestDb();
  _db.run(
    "INSERT INTO llm_configs (name, provider, api_key, is_default) VALUES ('Existing LLM', 'anthropic', 'key1', 'Y')"
  );
});

describe("GET /api/settings/llm", () => {
  it("LLM 설정 목록을 반환한다", async () => {
    const res = await GET(get("/api/settings/llm"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Existing LLM");
  });
});

describe("POST /api/settings/llm", () => {
  it("새 LLM 설정을 생성한다", async () => {
    const res = await POST(post("/api/settings/llm", validLlm));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    
    // DB 확인
    const rows = _db.exec("SELECT * FROM llm_configs WHERE name = 'OpenAI GPT-4'");
    expect(rows[0].values).toHaveLength(1);
  });

  it("필수 항목 누락 시 400을 반환한다", async () => {
    const res = await POST(post("/api/settings/llm", { provider: "openai" }));
    expect(res.status).toBe(400);
  });

  it("is_default=Y로 생성 시 기존 기본값을 해제한다", async () => {
    await POST(post("/api/settings/llm", { ...validLlm, name: "New Default", is_default: "Y" }));
    
    const rows = _db.exec("SELECT name, is_default FROM llm_configs ORDER BY id ASC");
    // Existing LLM (id 1) -> is_default 'N'
    // New Default (id 2) -> is_default 'Y'
    expect(rows[0].values[0][1]).toBe("N");
    expect(rows[0].values[1][1]).toBe("Y");
  });
});
