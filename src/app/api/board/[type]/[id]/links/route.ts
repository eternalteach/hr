import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { isBoardType } from "@/lib/boards/config";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ type: string; id: string }> };

function parseType(raw: string) {
  if (!isBoardType(raw)) throw new ApiError(400, "잘못된 게시판 유형");
  return raw;
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

const linkedTasksSql = `
  SELECT t.id, t.title, t.status, t.priority, t.due_date, t.completed_at, t.brd_id,
         b.brd_id AS brd_code, b.lob AS brd_lob,
         b.title_local AS brd_title_local, b.title_en AS brd_title_en
    FROM task_post_links l
    JOIN tasks t ON t.id = l.task_id
    LEFT JOIN brd b ON t.brd_id = b.id
   WHERE l.post_id = ? AND t.deleted_at IS NULL
   ORDER BY t.position ASC, t.id ASC
`;

const assigneesSql = `
  SELECT ta.task_id, m.id AS member_id, m.name AS member_name
    FROM task_post_links l
    JOIN task_assignees ta ON ta.task_id = l.task_id
    JOIN members m ON m.id = ta.member_id
   WHERE l.post_id = ?
   ORDER BY ta.assigned_at ASC, ta.id ASC
`;

function withAssignees(tasks: Record<string, unknown>[], rows: Record<string, unknown>[]) {
  const byTask: Record<number, { member_id: number; member_name: string }[]> = {};
  rows.forEach(r => {
    const tid = r.task_id as number;
    (byTask[tid] ??= []).push({
      member_id: r.member_id as number,
      member_name: r.member_name as string,
    });
  });
  return tasks.map(t => ({ ...t, assignees: byTask[t.id as number] ?? [] }));
}

export const GET = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const { type: rawType, id: rawId } = await params;
  const type = parseType(rawType);
  const id = parseId(rawId);
  const db = await getDb();

  const post = queryOne(
    db,
    "SELECT id FROM board_posts WHERE id = ? AND board_type = ?",
    [id, type]
  );
  if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다", "POST_NOT_FOUND");

  const rows = queryAll(db, linkedTasksSql, [id]);
  const assignees = queryAll(db, assigneesSql, [id]);
  return NextResponse.json(withAssignees(rows, assignees));
});

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { type: rawType, id: rawId } = await params;
  const type = parseType(rawType);
  const id = parseId(rawId);
  const db = await getDb();

  const post = queryOne(
    db,
    "SELECT id FROM board_posts WHERE id = ? AND board_type = ?",
    [id, type]
  );
  if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다", "POST_NOT_FOUND");

  const body = await request.json();
  const rawIds: unknown[] = Array.isArray(body?.task_ids) ? body.task_ids : [];
  const taskIds = Array.from(new Set(
    rawIds
      .map(v => Number(v))
      .filter(v => Number.isInteger(v) && v > 0)
  ));

  // 존재하고 삭제되지 않은 업무만 허용
  if (taskIds.length) {
    const placeholders = taskIds.map(() => "?").join(",");
    // eslint-disable-next-line no-restricted-syntax
    const found = queryAll(
      db,
      `SELECT id FROM tasks WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      taskIds
    );
    const foundIds = new Set(found.map(r => r.id as number));
    for (const tid of taskIds) {
      if (!foundIds.has(tid)) throw new ApiError(400, "존재하지 않는 업무", "TASK_NOT_FOUND");
    }
  }

  withTransaction(db, () => {
    db.run("DELETE FROM task_post_links WHERE post_id = ?", [id]);
    taskIds.forEach(tid => {
      db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (?, ?)", [tid, id]);
    });
  });

  saveDb();

  const rows = queryAll(db, linkedTasksSql, [id]);
  const assignees = queryAll(db, assigneesSql, [id]);
  return NextResponse.json(withAssignees(rows, assignees));
});
