import { getDb, saveDb } from "@/db";
import { queryAll, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async () => {
  const db = await getDb();
  return NextResponse.json(
    queryAll(db, "SELECT * FROM sow ORDER BY sow_id ASC")
  );
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const b = await request.json();

  if (!b.sow_id?.trim()) throw new ApiError(400, "SOW ID는 필수입니다");
  if (!b.content_ko?.trim()) throw new ApiError(400, "SOW 내용(한글)은 필수입니다");
  if (!b.content_en?.trim()) throw new ApiError(400, "SOW 내용(영어)은 필수입니다");

  const now = new Date().toISOString();
  const id = insertAndGetId(
    db,
    `INSERT INTO sow
       (sow_id, lob, title_ko, title_en, content_ko, content_en, note_ko, note_en, milestone, is_active, updated_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.sow_id.trim(),
      b.lob?.trim() || null,
      b.title_ko?.trim() || null,
      b.title_en?.trim() || null,
      b.content_ko.trim(),
      b.content_en.trim(),
      b.note_ko?.trim() || null,
      b.note_en?.trim() || null,
      b.milestone?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      now, now,
    ]
  );
  saveDb();
  return NextResponse.json({ id, ...b }, { status: 201 });
});
