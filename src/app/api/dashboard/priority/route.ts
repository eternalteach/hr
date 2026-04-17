import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec(`
    SELECT priority, COUNT(*) as count
    FROM tasks
    WHERE deleted_at IS NULL
    GROUP BY priority
    ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END
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
