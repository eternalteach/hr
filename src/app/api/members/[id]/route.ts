import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID");
  return id;
}

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  if (!queryOne(db, "SELECT id FROM members WHERE id = ?", [id])) {
    throw new ApiError(404, "팀원을 찾을 수 없습니다");
  }

  const body = await request.json();
  if (!body.name?.trim() || !body.email?.trim()) {
    throw new ApiError(400, "이름과 이메일은 필수입니다");
  }

  db.run(
    "UPDATE members SET name = ?, email = ?, role = ? WHERE id = ?",
    [body.name.trim(), body.email.trim(), body.role === "admin" ? "admin" : "member", id]
  );
  saveDb();

  return NextResponse.json(queryOne(db, "SELECT * FROM members WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  if (!queryOne(db, "SELECT id FROM members WHERE id = ?", [id])) {
    throw new ApiError(404, "팀원을 찾을 수 없습니다");
  }

  db.run("DELETE FROM members WHERE id = ?", [id]);
  saveDb();

  return NextResponse.json({ ok: true });
});
