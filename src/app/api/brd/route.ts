import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  return NextResponse.json(
    queryAll(db, "SELECT * FROM brd ORDER BY brd_id ASC")
  );
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const b = await request.json();

  if (!b.brd_id?.trim()) throw new ApiError(400, "BRD ID는 필수입니다");
  if (!b.sow_id?.trim()) throw new ApiError(400, "SOW ID는 필수입니다");
  if (b.data_language === "en") {
    if (!b.content_en?.trim()) throw new ApiError(400, "BRD 내용(영어)은 필수입니다");
  } else {
    if (!b.content_local?.trim()) throw new ApiError(400, "BRD 내용(Local)은 필수입니다");
  }

  const now = new Date().toISOString();
  const id = insertAndGetId(
    db,
    `INSERT INTO brd
       (brd_id, sow_id, lob, title_local, title_en, content_local, content_en, note_local, note_en, is_active, data_language, updated_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.brd_id.trim(),
      b.sow_id.trim(),
      b.lob?.trim() || null,
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local?.trim() || "",
      b.content_en?.trim() || "",
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      b.data_language || "local",
      now, now,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM brd WHERE id = ?", [id]), { status: 201 });
});
