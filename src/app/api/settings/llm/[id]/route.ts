import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/db";
import { queryOne } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "잘못된 ID", "INVALID_ID");
  return id;
}

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  const b = await req.json();
  const db = await getDb();

  const existing = queryOne(db, "SELECT * FROM llm_configs WHERE id = ?", [id]);
  if (!existing) throw new ApiError(404, "LLM 설정을 찾을 수 없습니다", "LLM_NOT_FOUND");

  if (b.name !== undefined && !b.name.trim()) throw new ApiError(400, "이름은 필수입니다", "NAME_REQUIRED");
  if (b.provider !== undefined && !b.provider.trim()) throw new ApiError(400, "제공자는 필수입니다", "PROVIDER_REQUIRED");
  if (b.api_key !== undefined && !b.api_key.trim()) throw new ApiError(400, "API 키는 필수입니다", "API_KEY_REQUIRED");

  const now = new Date().toISOString();

  // 만약 기본값으로 설정하려 한다면 기존 기본값 해제
  if (b.is_default === "Y") {
    db.run("UPDATE llm_configs SET is_default = 'N' WHERE is_default = 'Y' AND id != ?", [id]);
  }

  db.run(
    `UPDATE llm_configs SET
       name = COALESCE(?, name),
       provider = COALESCE(?, provider),
       base_url = ?,
       api_key = COALESCE(?, api_key),
       model = ?,
       is_active = COALESCE(?, is_active),
       is_default = COALESCE(?, is_default),
       updated_at = ?
     WHERE id = ?`,
    [
      b.name?.trim() || null,
      b.provider?.trim() || null,
      b.base_url?.trim() || null,
      b.api_key?.trim() || null,
      b.model?.trim() || null,
      b.is_active || null,
      b.is_default || null,
      now,
      id
    ]
  );

  saveDb(db);
  return NextResponse.json({ success: true });
});

export const DELETE = withApiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  const db = await getDb();

  db.run("DELETE FROM llm_configs WHERE id = ?", [id]);
  saveDb(db);

  return NextResponse.json({ success: true });
});
