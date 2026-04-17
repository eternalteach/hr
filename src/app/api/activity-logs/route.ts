import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec(`
    SELECT al.*, m.name as member_name, t.title as task_title
    FROM activity_logs al
    LEFT JOIN members m ON al.member_id = m.id
    LEFT JOIN tasks t ON al.task_id = t.id
    ORDER BY al.created_at DESC
    LIMIT 20
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
