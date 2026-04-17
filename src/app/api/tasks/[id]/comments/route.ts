import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const result = db.exec(`
    SELECT c.*, m.name as member_name, m.avatar_url
    FROM comments c
    JOIN members m ON c.member_id = m.id
    WHERE c.task_id = ${id}
    ORDER BY c.created_at ASC
  `);
  if (!result.length) return NextResponse.json([]);
  const cols = result[0].columns;
  const comments = result[0].values.map(row => {
    const c: Record<string, unknown> = {};
    cols.forEach((col, i) => { c[col] = row[i]; });
    c.member = { id: c.member_id, name: c.member_name, avatar_url: c.avatar_url };
    return c;
  });
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const body = await request.json();

  db.run(
    "INSERT INTO comments (task_id, member_id, content) VALUES (?, ?, ?)",
    [id, body.member_id || 1, body.content]
  );

  // 활동 로그
  db.run(
    "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'commented', ?)",
    [id, body.member_id || 1, JSON.stringify({ preview: body.content.substring(0, 50) })]
  );

  saveDb();
  return NextResponse.json({ success: true }, { status: 201 });
}
