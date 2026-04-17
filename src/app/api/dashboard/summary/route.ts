import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();

  const read = (sql: string) => (db.exec(sql)[0]?.values[0]?.[0] as number) ?? 0;

  return NextResponse.json({
    totalTasks: read("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL"),
    inProgress: read("SELECT COUNT(*) FROM tasks WHERE status IN ('in_progress','review') AND deleted_at IS NULL"),
    completedThisWeek: read("SELECT COUNT(*) FROM tasks WHERE status = 'done' AND completed_at >= datetime('now', '-7 days') AND deleted_at IS NULL"),
    overdue: read("SELECT COUNT(*) FROM tasks WHERE due_date < date('now') AND status != 'done' AND deleted_at IS NULL"),
  });
}
