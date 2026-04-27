import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  return NextResponse.json(
    queryAll(db, "SELECT * FROM common_codes WHERE code_group = 'LOB' ORDER BY code ASC")
  );
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const b = await request.json();

  if (!b.code?.trim()) throw new ApiError(400, "코드는 필수입니다");

  const now = new Date().toISOString();
  const id = insertAndGetId(
    db,
    `INSERT INTO common_codes
       (code_group, code, title_local, title_en, content_local, content_en, note_local, note_en, is_active, data_language, updated_at, created_at)
     VALUES ('LOB',?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.code.trim(),
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local?.trim() || null,
      b.content_en?.trim() || null,
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      b.data_language || "local",
      now, now,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM common_codes WHERE id = ?", [id]), { status: 201 });
});
