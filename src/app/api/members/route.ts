import { getDb, saveDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const db = await getDb();
  const result = db.exec("SELECT * FROM members ORDER BY id");
  if (!result.length) return NextResponse.json([]);
  const cols = result[0].columns;
  const members = result[0].values.map(row => {
    const m: Record<string, unknown> = {};
    cols.forEach((col, i) => { m[col] = row[i]; });
    return m;
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const body = await request.json();
  if (!body.name || !body.email) {
    return NextResponse.json({ error: "이름과 이메일은 필수입니다" }, { status: 400 });
  }
  db.run(
    "INSERT INTO members (name, email, role) VALUES (?, ?, ?)",
    [body.name, body.email, body.role || "member"]
  );
  saveDb();
  const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  return NextResponse.json({ id, ...body }, { status: 201 });
}
