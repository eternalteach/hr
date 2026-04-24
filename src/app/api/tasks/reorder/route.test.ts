import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('업무1', 'todo', 'medium', 1000)");
  _db.run("INSERT INTO tasks (title, status, priority, position) VALUES ('업무2', 'todo', 'medium', 2000)");
});

describe("POST /api/tasks/reorder", () => {
  it("업무 순서를 업데이트한다", async () => {
    const res = await POST(post("/api/tasks/reorder", {
      items: [{ id: 1, position: 5000 }, { id: 2, position: 1000 }],
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    const row = _db.exec("SELECT position FROM tasks WHERE id = 1")[0];
    expect(row.values[0][0]).toBe(5000);
  });

  it("items가 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/tasks/reorder", {}));
    expect(res.status).toBe(400);
  });

  it("items가 빈 배열이면 400을 반환한다", async () => {
    const res = await POST(post("/api/tasks/reorder", { items: [] }));
    expect(res.status).toBe(400);
  });

  it("items가 배열이 아니면 400을 반환한다", async () => {
    const res = await POST(post("/api/tasks/reorder", { items: "invalid" }));
    expect(res.status).toBe(400);
  });
});
