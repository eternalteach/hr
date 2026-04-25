import { getDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { verifyPassword } from "@/lib/crypto";
import { signSession, COOKIE_NAME } from "@/lib/session";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (request: NextRequest) => {
  const { email, password } = await request.json();
  if (!email || !password) throw new ApiError(400, "이메일과 비밀번호를 입력해주세요", "LOGIN_REQUIRED");

  const db = await getDb();
  const row = await queryOne(db, "SELECT id, role, password_hash, must_change_password FROM members WHERE email = ?", [email]);

  if (!row || !row.password_hash) {
    throw new ApiError(401, "이메일 또는 비밀번호가 올바르지 않습니다", "INVALID_CREDENTIALS");
  }

  if (!verifyPassword(password, row.password_hash as string)) {
    throw new ApiError(401, "이메일 또는 비밀번호가 올바르지 않습니다", "INVALID_CREDENTIALS");
  }

  const token = await signSession({
    sub: row.id as number,
    role: row.role as string,
    mustChange: row.must_change_password === 1,
  });

  const res = NextResponse.json({ ok: true, mustChange: row.must_change_password === 1 });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
});
