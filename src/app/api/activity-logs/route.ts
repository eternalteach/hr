import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  const data = queryAll(db, `
    SELECT al.*, m.name as member_name, t.title as task_title
    FROM activity_logs al
    LEFT JOIN members m ON al.member_id = m.id
    LEFT JOIN tasks t ON al.task_id = t.id
    ORDER BY al.created_at DESC
    LIMIT 20
  `);
  return NextResponse.json(data);
});
