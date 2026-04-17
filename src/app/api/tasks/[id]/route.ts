import { getDb, saveDb } from "@/db";
import { queryOne, withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}

export const GET = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  const task = queryOne(db, "SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL", [id]);
  if (!task) throw new ApiError(404, "업무를 찾을 수 없습니다");
  return NextResponse.json(task);
});

export const PATCH = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  const body = await request.json();
  const now = new Date().toISOString();

  const oldTask = queryOne(db, "SELECT * FROM tasks WHERE id = ?", [id]);
  if (!oldTask) throw new ApiError(404, "업무를 찾을 수 없습니다");

  // 상태 변경 시 완료일 자동 기록
  if (body.status === "done" && oldTask.status !== "done") {
    body.completed_at = now;
  }
  if (body.status && body.status !== "done" && oldTask.status === "done") {
    body.completed_at = null;
  }

  // 화이트리스트 필드만 업데이트 — 임의 컬럼 주입 방지
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

  const memberId = Number(body.member_id) || 1;

  withTransaction(db, () => {
    db.run(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, values);

    // 상태 변경 활동 로그
    if (body.status && body.status !== oldTask.status) {
      db.run(
        "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'status_changed', ?)",
        [id, memberId, JSON.stringify({ from: oldTask.status, to: body.status })]
      );
    }

    // 마감일 변경 시 캘린더 연동 업데이트
    if (body.due_date !== undefined) {
      db.run("DELETE FROM schedules WHERE task_id = ? AND type = 'deadline'", [id]);
      if (body.due_date) {
        const title = body.title || oldTask.title;
        db.run(
          "INSERT INTO schedules (title, type, start_at, task_id, created_by) VALUES (?, 'deadline', ?, ?, ?)",
          [`마감: ${title}`, body.due_date, id, memberId]
        );
      }
    }
  });

  saveDb();

  const task = queryOne(db, "SELECT * FROM tasks WHERE id = ?", [id]);
  return NextResponse.json(task);
});

export const DELETE = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  db.run("UPDATE tasks SET deleted_at = ? WHERE id = ?", [new Date().toISOString(), id]);
  saveDb();
  return NextResponse.json({ success: true });
});
