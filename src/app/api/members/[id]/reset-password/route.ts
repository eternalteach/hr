import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { hashPassword } from "@/lib/crypto";
import { verifySession, COOKIE_NAME } from "@/lib/session";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

export const POST = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new ApiError(401, "로그인이 필요합니다", "UNAUTHORIZED");

  const session = await verifySession(token);
  if (!session) throw new ApiError(401, "세션이 만료되었습니다", "UNAUTHORIZED");

  if (session.role !== "admin") {
    throw new ApiError(403, "관리자만 비밀번호를 초기화할 수 있습니다", "FORBIDDEN");
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  const member = queryOne(db, "SELECT id, email FROM members WHERE id = ?", [id]);
  if (!member) throw new ApiError(404, "팀원을 찾을 수 없습니다", "MEMBER_NOT_FOUND");

  db.run(
    "UPDATE members SET password_hash = ?, must_change_password = 1 WHERE id = ?",
    [hashPassword(member.email as string), id]
  );
  saveDb();

  return NextResponse.json({ ok: true });
});
