import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  const data = queryAll(db, `
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
  return NextResponse.json(data);
});
