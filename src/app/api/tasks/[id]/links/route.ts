import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

export const GET = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  const task = queryOne(db, "SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL", [id]);
  if (!task) throw new ApiError(404, "업무를 찾을 수 없습니다", "TASK_NOT_FOUND");

  const rows = queryAll(
    db,
    `SELECT p.* FROM task_post_links l
       JOIN board_posts p ON p.id = l.post_id
      WHERE l.task_id = ?
      ORDER BY COALESCE(p.reference_date, p.created_at) DESC, p.id DESC`,
    [id]
  );
  return NextResponse.json(rows);
});

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  const task = queryOne(db, "SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL", [id]);
  if (!task) throw new ApiError(404, "업무를 찾을 수 없습니다", "TASK_NOT_FOUND");

  const body = await request.json();
  const rawIds: unknown[] = Array.isArray(body?.post_ids) ? body.post_ids : [];
  const postIds = Array.from(new Set(
    rawIds
      .map(v => Number(v))
      .filter(v => Number.isInteger(v) && v > 0)
  ));

  // 존재하는 게시글만 허용
  if (postIds.length) {
    const placeholders = postIds.map(() => "?").join(",");
    // eslint-disable-next-line no-restricted-syntax
    const found = queryAll(db, `SELECT id FROM board_posts WHERE id IN (${placeholders})`, postIds);
    const foundIds = new Set(found.map(r => r.id as number));
    for (const pid of postIds) {
      if (!foundIds.has(pid)) throw new ApiError(400, "존재하지 않는 게시글", "POST_NOT_FOUND");
    }
  }

  withTransaction(db, () => {
    db.run("DELETE FROM task_post_links WHERE task_id = ?", [id]);
    postIds.forEach(pid => {
      db.run("INSERT INTO task_post_links (task_id, post_id) VALUES (?, ?)", [id, pid]);
    });
  });

  saveDb();

  const rows = queryAll(
    db,
    `SELECT p.* FROM task_post_links l
       JOIN board_posts p ON p.id = l.post_id
      WHERE l.task_id = ?
      ORDER BY COALESCE(p.reference_date, p.created_at) DESC, p.id DESC`,
    [id]
  );
  return NextResponse.json(rows);
});
