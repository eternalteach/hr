import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = "SELECT * FROM schedules WHERE 1=1";
  const bindings: unknown[] = [];
  if (from) { query += " AND start_at >= ?"; bindings.push(from); }
  if (to) { query += " AND start_at <= ?"; bindings.push(to); }
  query += " ORDER BY start_at ASC";

  const result = db.exec(query, bindings);
  if (!result.length) return NextResponse.json([]);
  const cols = result[0].columns;
  const schedules = result[0].values.map(row => {
    const s: Record<string, unknown> = {};
    cols.forEach((col, i) => { s[col] = row[i]; });
    return s;
  });
  return NextResponse.json(schedules);
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const body = await request.json();
  if (!body.title || !body.type || !body.start_at) {
    return NextResponse.json({ error: "제목, 유형, 시작 시간은 필수입니다" }, { status: 400 });
  }
  db.run(
    "INSERT INTO schedules (title, type, start_at, end_at, location, task_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [body.title, body.type, body.start_at, body.end_at || null, body.location || null, body.task_id || null, body.created_by || 1]
  );
  saveDb();
  const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  return NextResponse.json({ id, ...body }, { status: 201 });
}
