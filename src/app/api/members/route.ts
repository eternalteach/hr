import { getDb, saveDb } from "@/db";
import { queryAll, insertAndGetId } from "@/db/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  return NextResponse.json(queryAll(db, "SELECT * FROM members ORDER BY id"));
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const body = await request.json();
  if (!body.name || !body.email) {
    return NextResponse.json({ error: "이름과 이메일은 필수입니다" }, { status: 400 });
  }
  const id = insertAndGetId(
    db,
    "INSERT INTO members (name, email, role) VALUES (?, ?, ?)",
    [body.name, body.email, body.role || "member"]
  );
  saveDb();
  return NextResponse.json({ id, ...body }, { status: 201 });
}
