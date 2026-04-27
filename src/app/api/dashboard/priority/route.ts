import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  const data = queryAll(db, `
    SELECT priority, COUNT(*) as count
    FROM tasks
    WHERE deleted_at IS NULL
    GROUP BY priority
    ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END
  `);
  return NextResponse.json(data);
});
