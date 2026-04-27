import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/db";
import { queryAll, insertAndGetId } from "@/db/helpers";
import { ApiError, withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();
  const configs = queryAll(db, "SELECT * FROM llm_configs ORDER BY is_default DESC, created_at DESC", []);
  return NextResponse.json(configs);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const b = await req.json();
  const db = await getDb();

  if (!b.name?.trim()) throw new ApiError(400, "이름은 필수입니다", "NAME_REQUIRED");
  if (!b.provider?.trim()) throw new ApiError(400, "제공자는 필수입니다", "PROVIDER_REQUIRED");
  if (!b.api_key?.trim()) throw new ApiError(400, "API 키는 필수입니다", "API_KEY_REQUIRED");

  const now = new Date().toISOString();

  // 만약 기본값으로 설정하려 한다면 기존 기본값 해제
  if (b.is_default === "Y") {
    db.run("UPDATE llm_configs SET is_default = 'N' WHERE is_default = 'Y'");
  }

  const id = insertAndGetId(
    db,
    `INSERT INTO llm_configs 
       (name, provider, base_url, api_key, model, is_active, is_default, updated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.name.trim(),
      b.provider.trim(),
      b.base_url?.trim() || null,
      b.api_key.trim(),
      b.model?.trim() || null,
      b.is_active === "N" ? "N" : "Y",
      b.is_default === "Y" ? "Y" : "N",
      now, now
    ]
  );

  saveDb(db);
  return NextResponse.json({ id }, { status: 201 });
});
