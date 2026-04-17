import { getDb, saveDb } from "@/db";
import { queryAll, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = "SELECT * FROM schedules WHERE 1=1";
  const bindings: unknown[] = [];
  if (from) { query += " AND start_at >= ?"; bindings.push(from); }
  if (to) { query += " AND start_at <= ?"; bindings.push(to); }
  query += " ORDER BY start_at ASC";

  return NextResponse.json(queryAll(db, query, bindings));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const body = await request.json();
  if (!body.title || !body.type || !body.start_at) {
    throw new ApiError(400, "제목, 유형, 시작 시간은 필수입니다");
  }
  const id = insertAndGetId(
    db,
    "INSERT INTO schedules (title, type, start_at, end_at, location, task_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [body.title, body.type, body.start_at, body.end_at || null, body.location || null, body.task_id || null, Number(body.created_by) || 1]
  );
  saveDb();
  return NextResponse.json({ id, ...body }, { status: 201 });
});
