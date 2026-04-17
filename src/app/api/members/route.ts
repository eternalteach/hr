import { getDb, saveDb } from "@/db";
import { queryAll, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async () => {
  const db = await getDb();
  return NextResponse.json(queryAll(db, "SELECT * FROM members ORDER BY id"));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();
  const body = await request.json();
  if (!body.name || !body.email) {
    throw new ApiError(400, "이름과 이메일은 필수입니다");
  }
  const id = insertAndGetId(
    db,
    "INSERT INTO members (name, email, role) VALUES (?, ?, ?)",
    [body.name, body.email, body.role || "member"]
  );
  saveDb();
  return NextResponse.json({ id, ...body }, { status: 201 });
});
