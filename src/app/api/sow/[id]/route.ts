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

  if (!queryOne(db, "SELECT id FROM sow WHERE id = ?", [id])) {
    throw new ApiError(404, "SOW를 찾을 수 없습니다");
  }

  const b = await request.json();
  const existing = queryOne(db, "SELECT data_language FROM sow WHERE id = ?", [id]) as { data_language: string | null } | null;
  const dl = b.data_language || existing?.data_language || "local";

  if (!b.sow_id?.trim()) throw new ApiError(400, "SOW ID는 필수입니다");
  if (dl === "en") {
    if (!b.content_en?.trim()) throw new ApiError(400, "SOW 내용(영어)은 필수입니다");
  } else {
    if (!b.content_local?.trim()) throw new ApiError(400, "SOW 내용(Local)은 필수입니다");
  }

  db.run(
    `UPDATE sow SET
       sow_id=?, lob=?, title_local=?, title_en=?,
       content_local=?, content_en=?, note_local=?, note_en=?,
       milestone=?, is_active=?, updated_at=?
     WHERE id=?`,
    [
      b.sow_id.trim(),
      b.lob?.trim() || null,
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local?.trim() || "",
      b.content_en?.trim() || "",
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.milestone?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      new Date().toISOString(),
      id,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM sow WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  const db = await getDb();

  if (!queryOne(db, "SELECT id FROM sow WHERE id = ?", [id])) {
    throw new ApiError(404, "SOW를 찾을 수 없습니다");
  }

  db.run("DELETE FROM sow WHERE id = ?", [id]);
  saveDb();
  return NextResponse.json({ ok: true });
});
