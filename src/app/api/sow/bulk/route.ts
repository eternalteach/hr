import { getDb, saveDb } from "@/db";
import { withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface SowRow {
  sow_id: string;
  lob?: string;
  title_ko?: string;
  title_en?: string;
  content_ko: string;
  content_en: string;
  note_ko?: string;
  note_en?: string;
  milestone?: string;
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
    (body.rows as SowRow[]).forEach(row => {
      db.run(
        `INSERT INTO sow
           (sow_id, lob, title_ko, title_en, content_ko, content_en, note_ko, note_en, milestone, is_active, updated_at, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(sow_id) DO UPDATE SET
           lob        = excluded.lob,
           title_ko   = excluded.title_ko,
           title_en   = excluded.title_en,
           content_ko = excluded.content_ko,
           content_en = excluded.content_en,
           note_ko    = excluded.note_ko,
           note_en    = excluded.note_en,
           milestone  = excluded.milestone,
           is_active  = excluded.is_active,
           updated_at = excluded.updated_at`,
        [
          String(row.sow_id).trim(),
          row.lob?.trim() || null,
          row.title_ko?.trim() || null,
          row.title_en?.trim() || null,
          String(row.content_ko).trim(),
          String(row.content_en).trim(),
          row.note_ko?.trim() || null,
          row.note_en?.trim() || null,
          row.milestone?.trim() || null,
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
