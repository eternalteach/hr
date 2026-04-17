import { getDb, saveDb } from "@/db";
import { queryAll, withTransaction } from "@/db/helpers";
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
  const rows = queryAll(
    db,
    `SELECT c.*, m.name as member_name, m.avatar_url
     FROM comments c
     JOIN members m ON c.member_id = m.id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [id]
  );
  const comments = rows.map(c => ({
    ...c,
    member: { id: c.member_id, name: c.member_name, avatar_url: c.avatar_url },
  }));
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

  withTransaction(db, () => {
    db.run(
      "INSERT INTO comments (task_id, member_id, content) VALUES (?, ?, ?)",
      [id, memberId, body.content]
    );
    db.run(
      "INSERT INTO activity_logs (task_id, member_id, action, detail) VALUES (?, ?, 'commented', ?)",
      [id, memberId, JSON.stringify({ preview: body.content.substring(0, 50) })]
    );
  });

  saveDb();
  return NextResponse.json({ success: true }, { status: 201 });
}
