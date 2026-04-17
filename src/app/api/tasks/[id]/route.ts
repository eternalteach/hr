import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();

  const result = db.exec(`SELECT * FROM tasks WHERE id = ${id} AND deleted_at IS NULL`);
  if (!result.length || !result[0].values.length) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다" }, { status: 404 });
  }

  const cols = result[0].columns;
  const task: Record<string, unknown> = {};
  cols.forEach((col, i) => { task[col] = result[0].values[0][i]; });

  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const body = await request.json();
  const now = new Date().toISOString();

  // 현재 업무 조회
  const current = db.exec(`SELECT * FROM tasks WHERE id = ${id}`);
  if (!current.length || !current[0].values.length) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다" }, { status: 404 });
  }
  const cols = current[0].columns;
  const oldTask: Record<string, unknown> = {};
  cols.forEach((col, i) => { oldTask[col] = current[0].values[0][i]; });

  // 상태 변경 시 완료일 자동 기록
  if (body.status === "done" && oldTask.status !== "done") {
    body.completed_at = now;
  }
  if (body.status && body.status !== "done" && oldTask.status === "done") {
    body.completed_at = null;
  }

  // SET 절 동적 생성
  const updates: string[] = [];
  const values: unknown[] = [];
  const allowedFields = ["title", "description", "status", "priority", "due_date", "completed_at"];
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  });
  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.run(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, values);

  // 상태 변경 활동 로그
  if (body.status && body.status !== oldTask.status) {
    db.run(
      "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'status_changed', ?)",
      [id, body.member_id || 1, JSON.stringify({ from: oldTask.status, to: body.status })]
    );
  }

  // 마감일 변경 시 캘린더 연동 업데이트
  if (body.due_date !== undefined) {
    db.run("DELETE FROM schedules WHERE task_id = ? AND type = 'deadline'", [id]);
    if (body.due_date) {
      const title = body.title || oldTask.title;
      db.run(
        "INSERT INTO schedules (title, type, start_at, task_id, created_by) VALUES (?, 'deadline', ?, ?, ?)",
        [`마감: ${title}`, body.due_date, id, body.member_id || 1]
      );
    }
  }

  saveDb();

  const result = db.exec(`SELECT * FROM tasks WHERE id = ${id}`);
  const task: Record<string, unknown> = {};
  result[0].columns.forEach((col, i) => { task[col] = result[0].values[0][i]; });

  return NextResponse.json(task);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const now = new Date().toISOString();

  // soft delete
  db.run("UPDATE tasks SET deleted_at = ? WHERE id = ?", [now, id]);
  saveDb();

  return NextResponse.json({ success: true });
}
