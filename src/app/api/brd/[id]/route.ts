import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  if (!queryOne(db, "SELECT id FROM brd WHERE id = ?", [id])) {
    throw new ApiError(404, "BRD를 찾을 수 없습니다", "BRD_NOT_FOUND");
  }

  const b = await request.json();
  if (!b.brd_id?.trim()) throw new ApiError(400, "BRD ID는 필수입니다");
  if (!b.sow_id?.trim()) throw new ApiError(400, "SOW ID는 필수입니다");
  if (!b.content_local?.trim()) throw new ApiError(400, "BRD 내용(Local)은 필수입니다");
  if (!b.content_en?.trim()) throw new ApiError(400, "BRD 내용(영어)은 필수입니다");

  db.run(
    `UPDATE brd SET
       brd_id=?, sow_id=?, lob=?, title_local=?, title_en=?,
       content_local=?, content_en=?, note_local=?, note_en=?,
       is_active=?, updated_at=?
     WHERE id=?`,
    [
      b.brd_id.trim(),
      b.sow_id.trim(),
      b.lob?.trim() || null,
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local.trim(),
      b.content_en.trim(),
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      new Date().toISOString(),
      id,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM brd WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  if (!queryOne(db, "SELECT id FROM brd WHERE id = ?", [id])) {
    throw new ApiError(404, "BRD를 찾을 수 없습니다", "BRD_NOT_FOUND");
  }

  db.run("DELETE FROM brd WHERE id = ?", [id]);
  saveDb();
  return NextResponse.json({ ok: true });
});
