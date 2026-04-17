import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const data = queryAll(db, `
    SELECT priority, COUNT(*) as count
    FROM tasks
    WHERE deleted_at IS NULL
    GROUP BY priority
    ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END
  `);
  return NextResponse.json(data);
}
