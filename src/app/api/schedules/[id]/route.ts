import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  if (!queryOne(db, "SELECT id FROM schedules WHERE id = ?", [id])) {
    throw new ApiError(404, "일정을 찾을 수 없습니다");
  }

  const body = await request.json();
  if (!body.title?.trim() || !body.type || !body.start_at) {
    throw new ApiError(400, "제목, 유형, 시작 시간은 필수입니다");
  }

  db.run(
    "UPDATE schedules SET title = ?, type = ?, start_at = ?, end_at = ?, location = ? WHERE id = ?",
    [body.title.trim(), body.type, body.start_at, body.end_at || null, body.location || null, id]
  );
  saveDb();

  return NextResponse.json(queryOne(db, "SELECT * FROM schedules WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  if (!queryOne(db, "SELECT id FROM schedules WHERE id = ?", [id])) {
    throw new ApiError(404, "일정을 찾을 수 없습니다");
  }

  db.run("DELETE FROM schedules WHERE id = ?", [id]);
  saveDb();

  return NextResponse.json({ ok: true });
});
