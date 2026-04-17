import { getDb } from "@/db";
import { queryAll } from "@/db/helpers";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const data = queryAll(db, `
    SELECT s.*, m.name as creator_name
    FROM schedules s
    LEFT JOIN members m ON s.created_by = m.id
    WHERE s.start_at >= date('now')
      AND s.start_at <= date('now', '+7 days')
    ORDER BY s.start_at ASC
    LIMIT 10
  `);
  return NextResponse.json(data);
}
