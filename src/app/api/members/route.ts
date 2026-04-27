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
  const nameLocal = typeof body.name === "string" ? body.name.trim() : "";
  const nameEn = typeof body.name_en === "string" ? body.name_en.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!nameLocal || !email) {
    throw new ApiError(400, "이름과 이메일은 필수입니다", "NAME_EMAIL_REQUIRED");
  }
  if (!nameEn) {
    throw new ApiError(400, "영문 이름은 필수입니다", "NAME_EN_REQUIRED");
  }
  const role = ["admin", "leader", "member"].includes(body.role) ? body.role : "member";
  const id = insertAndGetId(
    db,
    "INSERT INTO members (name, name_en, email, lob, role) VALUES (?, ?, ?, ?, ?)",
    [nameLocal, nameEn, email, body.lob ?? null, role]
  );
  saveDb();
  return NextResponse.json({ id, ...body, name: nameLocal, name_en: nameEn, email, role }, { status: 201 });
});
