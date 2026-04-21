import { getDb, saveDb } from "@/db";
import { withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface BrdRow {
  brd_id: string;
  sow_id: string;
  lob?: string;
  title_local?: string;
  title_en?: string;
  content_local: string;
  content_en: string;
  note_local?: string;
  note_en?: string;
  is_active?: string;
}

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const body = await request.json();

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    throw new ApiError(400, "rows 배열이 필요합니다");
  }

  const now = new Date().toISOString();
  let upserted = 0;

  withTransaction(db, () => {
    (body.rows as BrdRow[]).forEach(row => {
      db.run(
        `INSERT INTO brd
           (brd_id, sow_id, lob, title_local, title_en, content_local, content_en, note_local, note_en, is_active, updated_at, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(brd_id) DO UPDATE SET
           sow_id     = excluded.sow_id,
           lob        = excluded.lob,
           title_local   = excluded.title_local,
           title_en   = excluded.title_en,
           content_local = excluded.content_local,
           content_en = excluded.content_en,
           note_local    = excluded.note_local,
           note_en    = excluded.note_en,
           is_active  = excluded.is_active,
           updated_at = excluded.updated_at`,
        [
          String(row.brd_id).trim(),
          String(row.sow_id).trim(),
          row.lob?.trim() || null,
          row.title_local?.trim() || null,
          row.title_en?.trim() || null,
          String(row.content_local).trim(),
          String(row.content_en).trim(),
          row.note_local?.trim() || null,
          row.note_en?.trim() || null,
          row.is_active === "N" ? "N" : "Y",
          now, now,
        ]
      );
      upserted++;
    });
  });
  saveDb();

  return NextResponse.json({ upserted });
});
