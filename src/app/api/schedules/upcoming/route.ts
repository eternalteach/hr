import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec(`
    SELECT s.*, m.name as creator_name
    FROM schedules s
    LEFT JOIN members m ON s.created_by = m.id
    WHERE s.start_at >= date('now')
      AND s.start_at <= date('now', '+7 days')
    ORDER BY s.start_at ASC
    LIMIT 10
  `);

  if (!result.length) return NextResponse.json([]);
  const cols = result[0].columns;
  const data = result[0].values.map(row => {
    const r: Record<string, unknown> = {};
    cols.forEach((col, i) => { r[col] = row[i]; });
    return r;
  });
  return NextResponse.json(data);
}
