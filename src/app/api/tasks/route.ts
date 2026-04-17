import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignee = searchParams.get("assignee");

  let query = `
    SELECT t.*,
      (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
      (SELECT GROUP_CONCAT(ta.member_id) FROM task_assignees ta WHERE ta.task_id = t.id) as assignee_ids
    FROM tasks t
    WHERE t.deleted_at IS NULL
  `;
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (status) { conditions.push("t.status = ?"); bindings.push(status); }
  if (priority) { conditions.push("t.priority = ?"); bindings.push(priority); }
  if (assignee) {
    const assigneeId = Number(assignee);
    if (Number.isFinite(assigneeId)) {
      conditions.push("t.id IN (SELECT task_id FROM task_assignees WHERE member_id = ?)");
      bindings.push(assigneeId);
    }
  }
  if (conditions.length) query += " AND " + conditions.join(" AND ");
  query += " ORDER BY t.updated_at DESC";

  const result = db.exec(query, bindings);
  if (!result.length) return NextResponse.json([]);

  const columns = result[0].columns;
  const tasks = result[0].values.map(row => {
    const task: Record<string, unknown> = {};
    columns.forEach((col, i) => { task[col] = row[i]; });
    return task;
  });

  // 담당자 정보 조인
  const memberResult = db.exec("SELECT * FROM members");
  const members: Record<number, Record<string, unknown>> = {};
  if (memberResult.length) {
    const mCols = memberResult[0].columns;
    memberResult[0].values.forEach(row => {
      const m: Record<string, unknown> = {};
      mCols.forEach((col, i) => { m[col] = row[i]; });
      members[m.id as number] = m;
    });
  }

  // 태그 정보 조인
  const tagResult = db.exec("SELECT tt.task_id, t.* FROM task_tags tt JOIN tags t ON tt.tag_id = t.id");
  const taskTags: Record<number, Array<Record<string, unknown>>> = {};
  if (tagResult.length) {
    const tCols = tagResult[0].columns;
    tagResult[0].values.forEach(row => {
      const t: Record<string, unknown> = {};
      tCols.forEach((col, i) => { t[col] = row[i]; });
      const tid = t.task_id as number;
      if (!taskTags[tid]) taskTags[tid] = [];
      taskTags[tid].push(t);
    });
  }

  // 담당자 배정 정보
  const assigneeResult = db.exec("SELECT * FROM task_assignees");
  const taskAssignees: Record<number, Array<Record<string, unknown>>> = {};
  if (assigneeResult.length) {
    const aCols = assigneeResult[0].columns;
    assigneeResult[0].values.forEach(row => {
      const a: Record<string, unknown> = {};
      aCols.forEach((col, i) => { a[col] = row[i]; });
      const tid = a.task_id as number;
      if (!taskAssignees[tid]) taskAssignees[tid] = [];
      taskAssignees[tid].push({ ...a, member: members[a.member_id as number] });
    });
  }

  const enriched = tasks.map(t => ({
    ...t,
    assignees: taskAssignees[t.id as number] || [],
    tags: taskTags[t.id as number] || [],
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const body = await request.json();
  const { title, description, priority, due_date, assignee_ids, tag_ids, created_by } = body;

  if (!title) return NextResponse.json({ error: "제목은 필수입니다" }, { status: 400 });

  const now = new Date().toISOString();
  db.run(
    `INSERT INTO tasks (title, description, priority, due_date, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, priority || "medium", due_date || null, created_by || 1, now, now]
  );

  const taskId = (db.exec("SELECT last_insert_rowid()")[0].values[0][0]) as number;

  // 담당자 배정
  if (assignee_ids?.length) {
    assignee_ids.forEach((mid: number) => {
      db.run("INSERT INTO task_assignees (task_id, member_id) VALUES (?, ?)", [taskId, mid]);
    });
  }

  // 태그 연결
  if (tag_ids?.length) {
    tag_ids.forEach((tid: number) => {
      db.run("INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)", [taskId, tid]);
    });
  }

  // 활동 로그
  db.run(
    "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'created', ?)",
    [taskId, created_by || 1, JSON.stringify({ title })]
  );

  // 마감일 → 캘린더 자동 연동
  if (due_date) {
    db.run(
      "INSERT INTO schedules (title, type, start_at, task_id, created_by) VALUES (?, 'deadline', ?, ?, ?)",
      [`마감: ${title}`, due_date, taskId, created_by || 1]
    );
  }

  saveDb();

  // 생성된 업무 반환
  const result = db.exec("SELECT * FROM tasks WHERE id = ?", [taskId]);
  const cols = result[0].columns;
  const task: Record<string, unknown> = {};
  cols.forEach((col, i) => { task[col] = result[0].values[0][i]; });

  return NextResponse.json(task, { status: 201 });
}
