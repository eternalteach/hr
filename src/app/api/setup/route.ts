import { getDb, saveDb } from "@/db";
import { insertAndGetId } from "@/db/helpers";
import { hashPassword } from "@/lib/crypto";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

/** 초기 설정: 첫 번째 관리자 계정 생성. 이미 관리자가 있으면 거부. */
export const POST = withApiHandler(async (request: NextRequest) => {
  const db = await getDb();

  const adminCount = (db.exec(
    "SELECT COUNT(*) FROM members WHERE role = 'admin' AND password_hash IS NOT NULL"
  )[0]?.values[0][0] as number) ?? 0;

  if (adminCount > 0) {
    throw new ApiError(403, "이미 관리자 계정이 존재합니다");
  }

  const { name, email, password } = await request.json();

  if (!name?.trim()) throw new ApiError(400, "이름은 필수입니다");
  if (!email?.trim()) throw new ApiError(400, "이메일은 필수입니다");
  if (!password || password.length < 8) throw new ApiError(400, "비밀번호는 8자 이상이어야 합니다");

  const existing = db.exec("SELECT id FROM members WHERE email = ?", [email.trim()]);
  if (existing[0]?.values?.length) {
    throw new ApiError(409, "이미 사용 중인 이메일입니다");
  }

  insertAndGetId(
    db,
    "INSERT INTO members (name, email, lob, role, password_hash, must_change_password) VALUES (?, ?, NULL, 'admin', ?, 0)",
    [name.trim(), email.trim(), hashPassword(password)]
  );
  saveDb();

  return NextResponse.json({ ok: true }, { status: 201 });
});
