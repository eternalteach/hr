import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";

export const GET = withApiHandler(async () => {
  const db = await getDb();
  const data = queryAll(db, `
    SELECT m.id, m.name,
      COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0) as completed,
      COALESCE(SUM(CASE WHEN t.status IN ('in_progress','review') THEN 1 ELSE 0 END), 0) as in_progress,
      COALESCE(SUM(CASE WHEN t.due_date < date('now') AND t.status != 'done' AND t.deleted_at IS NULL THEN 1 ELSE 0 END), 0) as overdue
    FROM members m
    LEFT JOIN task_assignees ta ON m.id = ta.member_id
    LEFT JOIN tasks t ON ta.task_id = t.id AND t.deleted_at IS NULL
    GROUP BY m.id
    ORDER BY m.id
  `);
  return NextResponse.json(data);
});
