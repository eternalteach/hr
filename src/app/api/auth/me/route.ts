import { getDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { verifySession, COOKIE_NAME } from "@/lib/session";
import { withApiHandler } from "@/lib/api-handler";
import { ApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiHandler(async (request: NextRequest) => {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new ApiError(401, "로그인이 필요합니다");

  const session = await verifySession(token);
  if (!session) throw new ApiError(401, "세션이 만료되었습니다");

  const db = await getDb();
  const member = queryOne(
    db,
    "SELECT id, name, email, avatar_url, lob, role, must_change_password FROM members WHERE id = ?",
    [session.sub]
  );
  if (!member) throw new ApiError(401, "사용자를 찾을 수 없습니다");

  return NextResponse.json(member);
});
