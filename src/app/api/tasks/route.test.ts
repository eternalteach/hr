import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, get, post } from "@/test/helpers";
import type { Database as SqlJsDatabase } from "sql.js";

let _db: SqlJsDatabase;

vi.mock("@/db", () => ({
  getDb: vi.fn(async () => _db),
  saveDb: vi.fn(),
}));

import { GET, POST } from "./route";

beforeEach(async () => {
  _db = await createTestDb();
  _db.run("INSERT INTO members (name, email, role) VALUES (?, ?, 'admin')", ["관리자", "admin@test.com"]);
});

function insertTask(title: string, opts: Record<string, unknown> = {}) {
  _db.run(
    "INSERT INTO tasks (title, status, priority, position, created_by) VALUES (?, ?, ?, ?, 1)",
    [title, opts.status ?? "todo", opts.priority ?? "medium", opts.position ?? 0]
  );
}

describe("GET /api/tasks", () => {
  it("삭제되지 않은 업무 목록을 반환한다", async () => {
    insertTask("업무1");
    insertTask("업무2");
    _db.run("INSERT INTO tasks (title, status, priority, position, deleted_at) VALUES ('삭제됨', 'todo', 'low', 0, datetime('now'))");
    const res = await GET(get("/api/tasks"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("업무가 없으면 빈 배열을 반환한다", async () => {
    const res = await GET(get("/api/tasks"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("status 필터로 업무를 필터링한다", async () => {
    insertTask("진행중업무", { status: "in_progress" });
    insertTask("완료업무", { status: "done" });
    const res = await GET(get("/api/tasks", { status: "in_progress" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("진행중업무");
  });

  it("priority 필터로 업무를 필터링한다", async () => {
    insertTask("긴급업무", { priority: "urgent" });
    insertTask("낮은업무", { priority: "low" });
    const res = await GET(get("/api/tasks", { priority: "urgent" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("긴급업무");
  });

  it("assignee 필터로 담당자 업무를 필터링한다", async () => {
    insertTask("담당업무");
    insertTask("다른업무");
    _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1)");
    const res = await GET(get("/api/tasks", { assignee: "1" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("담당업무");
  });

  it("title 필터로 업무를 검색한다", async () => {
    insertTask("중요한 업무");
    insertTask("일반 업무");
    const res = await GET(get("/api/tasks", { title: "중요" }));
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it("잘못된 assignee ID는 무시한다", async () => {
    insertTask("업무");
    const res = await GET(get("/api/tasks", { assignee: "not-a-number" }));
    expect(res.status).toBe(200);
  });

  it("assignee와 tags가 함께 반환된다", async () => {
    insertTask("업무");
    _db.run("INSERT INTO tags (name, color) VALUES ('태그', '#000')");
    _db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1)");
    _db.run("INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)");
    const res = await GET(get("/api/tasks"));
    const body = await res.json();
    expect(body[0].assignees).toHaveLength(1);
    expect(body[0].tags).toHaveLength(1);
  });
});

describe("POST /api/tasks", () => {
  it("새 업무를 생성한다", async () => {
    const res = await POST(post("/api/tasks", { title: "새 업무", priority: "high" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("새 업무");
    expect(body.priority).toBe("high");
  });

  it("제목이 없으면 400을 반환한다", async () => {
    const res = await POST(post("/api/tasks", { priority: "high" }));
    expect(res.status).toBe(400);
  });

  it("담당자와 태그를 함께 생성할 수 있다", async () => {
    _db.run("INSERT INTO tags (name, color) VALUES ('태그', '#000')");
    const res = await POST(post("/api/tasks", {
      title: "업무",
      assignee_ids: [1],
      tag_ids: [1],
    }));
    expect(res.status).toBe(201);
    const assignees = _db.exec("SELECT * FROM task_assignees WHERE task_id = 1");
    expect(assignees[0]?.values?.length).toBe(1);
    const tags = _db.exec("SELECT * FROM task_tags WHERE task_id = 1");
    expect(tags[0]?.values?.length).toBe(1);
  });

  it("due_date가 있으면 스케줄을 자동 생성한다", async () => {
    const res = await POST(post("/api/tasks", { title: "마감업무", due_date: "2026-05-01" }));
    expect(res.status).toBe(201);
    const schedules = _db.exec("SELECT * FROM schedules WHERE type = 'deadline'");
    expect(schedules[0]?.values?.length).toBe(1);
  });

  it("activity_log가 생성된다", async () => {
    await POST(post("/api/tasks", { title: "로그업무" }));
    const logs = _db.exec("SELECT * FROM activity_logs WHERE action = 'created'");
    expect(logs[0]?.values?.length).toBe(1);
  });

  it("기본 priority가 medium으로 설정된다", async () => {
    const res = await POST(post("/api/tasks", { title: "기본업무" }));
    const body = await res.json();
    expect(body.priority).toBe("medium");
  });

  it("brd_id를 지정할 수 있다", async () => {
    _db.run("INSERT INTO brd (brd_id, sow_id, content_local, content_en) VALUES ('BRD-01', 'SOW-01', '내용', 'content')");
    const res = await POST(post("/api/tasks", { title: "BRD업무", brd_id: 1 }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.brd_id).toBe(1);
  });
});
