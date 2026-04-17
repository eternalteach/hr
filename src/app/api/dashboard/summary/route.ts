import { getDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();

  const total = db.exec("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL");
  const inProgress = db.exec("SELECT COUNT(*) FROM tasks WHERE status IN ('in_progress','review') AND deleted_at IS NULL");
  const completedWeek = db.exec("SELECT COUNT(*) FROM tasks WHERE status = 'done' AND completed_at >= datetime('now', '-7 days') AND deleted_at IS NULL");
  const overdue = db.exec("SELECT COUNT(*) FROM tasks WHERE due_date < date('now') AND status != 'done' AND deleted_at IS NULL");

  return NextResponse.json({
    totalTasks: total[0]?.values[0]?.[0] ?? 0,
    inProgress: inProgress[0]?.values[0]?.[0] ?? 0,
    completedThisWeek: completedWeek[0]?.values[0]?.[0] ?? 0,
    overdue: overdue[0]?.values[0]?.[0] ?? 0,
  });
}
