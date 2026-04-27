import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

function adminCount(db: ReturnType<typeof Object.create>): number {
  return (db.exec(
    "SELECT COUNT(*) FROM members WHERE role = 'admin'"
  )[0]?.values[0][0] as number) ?? 0;
}

export const PUT = withApiHandler(async (request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  const current = queryOne(db, "SELECT id, role FROM members WHERE id = ?", [id]);
  if (!current) throw new ApiError(404, "팀원을 찾을 수 없습니다", "MEMBER_NOT_FOUND");

  const body = await request.json();
  if (!body.name?.trim() || !body.email?.trim()) {
    throw new ApiError(400, "이름과 이메일은 필수입니다", "NAME_EMAIL_REQUIRED");
  }
  if (!body.name_en?.trim()) {
    throw new ApiError(400, "영문 이름은 필수입니다", "NAME_EN_REQUIRED");
  }

  const role = ["admin", "leader", "member"].includes(body.role) ? body.role : "member";

  // 마지막 관리자의 역할을 내리려는 경우 차단
  if (current.role === "admin" && role !== "admin" && adminCount(db) <= 1) {
    throw new ApiError(400, "마지막 관리자 계정의 역할은 변경할 수 없습니다", "LAST_ADMIN");
  }

  db.run(
    "UPDATE members SET name = ?, name_en = ?, email = ?, lob = ?, role = ? WHERE id = ?",
    [body.name.trim(), body.name_en.trim(), body.email.trim(), body.lob ?? null, role, id]
  );
  saveDb();

  return NextResponse.json(queryOne(db, "SELECT * FROM members WHERE id = ?", [id]));
});

export const DELETE = withApiHandler(async (_request: NextRequest, { params }: Params) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  const db = await getDb();
  const current = queryOne(db, "SELECT id, role FROM members WHERE id = ?", [id]);
  if (!current) throw new ApiError(404, "팀원을 찾을 수 없습니다", "MEMBER_NOT_FOUND");

  // 마지막 관리자 삭제 차단
  if (current.role === "admin" && adminCount(db) <= 1) {
    throw new ApiError(400, "마지막 관리자 계정은 삭제할 수 없습니다", "LAST_ADMIN");
  }

  db.run("DELETE FROM members WHERE id = ?", [id]);
  saveDb();

  return NextResponse.json({ ok: true });
});
