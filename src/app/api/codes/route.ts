import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const group = new URL(request.url).searchParams.get("group");
  const rows = group
    ? queryAll(db, "SELECT * FROM common_codes WHERE code_group = ? ORDER BY code ASC", [group])
    : queryAll(db, "SELECT * FROM common_codes ORDER BY code_group ASC, code ASC");
  return NextResponse.json(rows);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const b = await request.json();

  if (!b.code_group?.trim()) throw new ApiError(400, "그룹은 필수입니다");
  if (!b.code?.trim()) throw new ApiError(400, "코드는 필수입니다");

  if (queryOne(db, "SELECT id FROM common_codes WHERE code = ?", [b.code.trim()])) {
    throw new ApiError(409, "이미 존재하는 코드입니다");
  }

  const now = new Date().toISOString();
  const id = insertAndGetId(
    db,
    `INSERT INTO common_codes
       (code_group, code, title_local, title_en, content_local, content_en, note_local, note_en, is_active, updated_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.code_group.trim(),
      b.code.trim(),
      b.title_local?.trim() || null,
      b.title_en?.trim() || null,
      b.content_local?.trim() || null,
      b.content_en?.trim() || null,
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      now, now,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM common_codes WHERE id = ?", [id]), { status: 201 });
});
