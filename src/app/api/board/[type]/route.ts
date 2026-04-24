import { getDb, saveDb } from "@/db";
import { queryAll, queryOne, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { BOARD_CONFIGS, isBoardType } from "@/lib/boards/config";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ type: string }> };

function parseType(raw: string) {
  if (!isBoardType(raw)) throw new ApiError(400, "잘못된 게시판 유형");
  return raw;
}

export const GET = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const type = parseType((await params).type);
  const db = await getDb();
  const lob = new URL(request.url).searchParams.get("lob");
  const rows = lob
    ? queryAll(
        db,
        "SELECT * FROM board_posts WHERE board_type = ? AND lob = ? ORDER BY COALESCE(reference_date, created_at) DESC, id DESC",
        [type, lob]
      )
    : queryAll(
        db,
        "SELECT * FROM board_posts WHERE board_type = ? ORDER BY COALESCE(reference_date, created_at) DESC, id DESC",
        [type]
      );
  return NextResponse.json(rows);
});

export const POST = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const type = parseType((await params).type);
  const db = await getDb();
  const b = await request.json();
  const cfg = BOARD_CONFIGS[type];

  if (!b.title_local?.trim()) {
    throw new ApiError(400, "제목(Local)은 필수입니다", "TITLE_REQUIRED");
  }

  const now = new Date().toISOString();
  const id = insertAndGetId(
    db,
    `INSERT INTO board_posts
       (board_type, lob, title_local, title_en, content_local, content_en, note_local, note_en, reference_date, is_active, updated_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      type,
      b.lob?.trim() || null,
      b.title_local.trim(),
      b.title_en?.trim() || null,
      b.content_local?.trim() || null,
      b.content_en?.trim() || null,
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      cfg.hasReferenceDate ? (b.reference_date?.trim() || null) : null,
      b.is_active === "N" ? "N" : "Y",
      now, now,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM board_posts WHERE id = ?", [id]), { status: 201 });
});
