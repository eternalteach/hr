import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { BOARD_CONFIGS, isBoardType } from "@/lib/boards/config";
import { deleteAllForOwner } from "@/lib/attachments/storage";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ type: string; id: string }> };

function parseType(raw: string) {
  if (!isBoardType(raw)) throw new ApiError(400, "잘못된 게시판 유형");
  return raw;
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { type: rawType, id: rawId } = await params;
  const type = parseType(rawType);
  const id = parseId(rawId);
  const db = await getDb();
  const cfg = BOARD_CONFIGS[type];

  const existing = queryOne(
    db,
    "SELECT id FROM board_posts WHERE id = ? AND board_type = ?",
    [id, type]
  );
  if (!existing) throw new ApiError(404, "게시글을 찾을 수 없습니다", "POST_NOT_FOUND");

  const b = await request.json();
  if (!b.title_local?.trim()) {
    throw new ApiError(400, "제목(Local)은 필수입니다", "TITLE_REQUIRED");
  }

  db.run(
    `UPDATE board_posts SET
       lob=?, title_local=?, title_en=?, content_local=?, content_en=?,
       note_local=?, note_en=?, reference_date=?, is_active=?, updated_at=?
     WHERE id=? AND board_type=?`,
    [
      b.lob?.trim() || null,
      b.title_local.trim(),
      b.title_en?.trim() || null,
      b.content_local?.trim() || null,
      b.content_en?.trim() || null,
      b.note_local?.trim() || null,
      b.note_en?.trim() || null,
      cfg.hasReferenceDate ? (b.reference_date?.trim() || null) : null,
      b.is_active === "N" ? "N" : "Y",
      new Date().toISOString(),
      id, type,
    ]
  );
  saveDb();
  return NextResponse.json(queryOne(db, "SELECT * FROM board_posts WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: Params) => {
  const { type: rawType, id: rawId } = await params;
  const type = parseType(rawType);
  const id = parseId(rawId);
  const db = await getDb();

  const existing = queryOne(
    db,
    "SELECT id FROM board_posts WHERE id = ? AND board_type = ?",
    [id, type]
  );
  if (!existing) throw new ApiError(404, "게시글을 찾을 수 없습니다", "POST_NOT_FOUND");

  // 첨부파일까지 함께 삭제 (DB 행 + 디스크 파일) — saveDb는 deleteAllForOwner 내부 db.run 다음 1회면 충분
  deleteAllForOwner(db, "board_post", id);
  db.run("DELETE FROM board_posts WHERE id = ? AND board_type = ?", [id, type]);
  saveDb();
  return NextResponse.json({ ok: true });
});
