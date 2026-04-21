import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { verifySession, signSession, COOKIE_NAME } from "@/lib/session";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (request: NextRequest) => {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new ApiError(401, "로그인이 필요합니다");

  const session = await verifySession(token);
  if (!session) throw new ApiError(401, "세션이 만료되었습니다");

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "새 비밀번호는 8자 이상이어야 합니다");
  }

  const db = await getDb();
  const row = queryOne(
    db,
    "SELECT id, password_hash, must_change_password FROM members WHERE id = ?",
    [session.sub]
  );
  if (!row) throw new ApiError(404, "사용자를 찾을 수 없습니다");

  // 최초 변경이 아닌 경우 현재 비밀번호 확인
  if (!row.must_change_password) {
    if (!currentPassword) throw new ApiError(400, "현재 비밀번호를 입력해주세요");
    if (!verifyPassword(currentPassword, row.password_hash as string)) {
      throw new ApiError(401, "현재 비밀번호가 올바르지 않습니다");
    }
  }

  db.run(
    "UPDATE members SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    [hashPassword(newPassword), session.sub]
  );
  saveDb();

  // 새 토큰 발급 (mustChange → false)
  const newToken = await signSession({
    sub: session.sub,
    role: session.role,
    mustChange: false,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
});
