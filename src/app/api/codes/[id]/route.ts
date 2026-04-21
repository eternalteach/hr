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
  const id = parseId((await params).id);
  const db = await getDb();

  if (!queryOne(db, "SELECT id FROM common_codes WHERE id = ?", [id])) {
    throw new ApiError(404, "공통코드를 찾을 수 없습니다");
  }

  const b = await request.json();
  if (!b.code?.trim()) throw new ApiError(400, "코드는 필수입니다");

  const dup = queryOne(db, "SELECT id FROM common_codes WHERE code = ? AND id != ?", [b.code.trim(), id]);
  if (dup) throw new ApiError(409, "이미 존재하는 코드입니다");

  db.run(
    `UPDATE common_codes SET
       code=?, title_local=?, title_en=?, content_local=?, content_en=?,
       note_local=?, note_en=?, is_active=?, updated_at=?
     WHERE id=?`,
    [
      b.code.trim(),
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local?.trim() || null,
      b.content_en?.trim() || null,
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      new Date().toISOString(),
      id,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM common_codes WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  if (!queryOne(db, "SELECT id FROM common_codes WHERE id = ?", [id])) {
    throw new ApiError(404, "공통코드를 찾을 수 없습니다");
  }

  db.run("DELETE FROM common_codes WHERE id = ?", [id]);
  saveDb();
  return NextResponse.json({ ok: true });
});
