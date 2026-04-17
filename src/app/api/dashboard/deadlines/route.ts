import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec(`
    SELECT t.*, 
      (SELECT GROUP_CONCAT(m.name) FROM task_assignees ta JOIN members m ON ta.member_id = m.id WHERE ta.task_id = t.id) as assignee_names
    FROM tasks t
    WHERE t.deleted_at IS NULL
      AND t.status != 'done'
      AND t.due_date IS NOT NULL
      AND t.due_date <= date('now', '+7 days')
    ORDER BY t.due_date ASC
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
