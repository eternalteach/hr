import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });

  const db = await getDb();
  const result = db.exec(
    `SELECT c.*, m.name as member_name, m.avatar_url
     FROM comments c
     JOIN members m ON c.member_id = m.id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [id]
  );
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
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });

  const db = await getDb();
  const body = await request.json();
  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다" }, { status: 400 });
  }
  const memberId = Number(body.member_id) || 1;

  db.run(
    "INSERT INTO comments (task_id, member_id, content) VALUES (?, ?, ?)",
    [id, memberId, body.content]
  );

  // 활동 로그
  db.run(
    "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'commented', ?)",
    [id, memberId, JSON.stringify({ preview: body.content.substring(0, 50) })]
  );

  saveDb();
  return NextResponse.json({ success: true }, { status: 201 });
}
