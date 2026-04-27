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

  // 회의록처럼 task 링크가 의미 있는 보드를 위해 진행률 카운트 함께 반환 — glossary는 항상 0
  const baseSelect = `
    SELECT bp.*,
      (SELECT COUNT(*) FROM task_post_links l JOIN tasks t ON t.id = l.task_id
        WHERE l.post_id = bp.id AND t.deleted_at IS NULL) AS linked_tasks_total,
      (SELECT COUNT(*) FROM task_post_links l JOIN tasks t ON t.id = l.task_id
        WHERE l.post_id = bp.id AND t.deleted_at IS NULL AND t.status = 'done') AS linked_tasks_done
    FROM board_posts bp
  `;
  const rows = lob
    ? queryAll(
        db,
        `${baseSelect} WHERE bp.board_type = ? AND bp.lob = ? ORDER BY COALESCE(bp.reference_date, bp.created_at) DESC, bp.id DESC`,
        [type, lob]
      )
    : queryAll(
        db,
        `${baseSelect} WHERE bp.board_type = ? ORDER BY COALESCE(bp.reference_date, bp.created_at) DESC, bp.id DESC`,
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
