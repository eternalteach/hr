import { getDb, saveDb } from "@/db";
import { queryAll, withTransaction } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { verifySession, COOKIE_NAME } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}

export const GET = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

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
});

export const POST = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) throw new ApiError(401, "로그인이 필요합니다");
  const memberId = session.sub;

  const db = await getDb();
  const body = await request.json();
  if (!body.content || typeof body.content !== "string") {
    throw new ApiError(400, "내용은 필수입니다");
  }

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
});
