import { getDb } from "@/db";
import { isDbConfigured, getDbConfig } from "@/db/config";
import { withApiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";

/**
 * 설치 단계 반환
 * - step: 'db'    → DB 미설정, DB 선택 화면 표시
 * - step: 'admin' → DB 설정됨, 관리자 계정 생성 화면 표시
 * - step: 'done'  → 설치 완료
 */
export const GET = withApiHandler(async () => {
  if (!isDbConfigured()) {
    return NextResponse.json({ needsSetup: true, step: "db" });
  }

  const db = await getDb();
  const result = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM members WHERE role = 'admin' AND password_hash IS NOT NULL"
  );
  const count = (result?.count as number) ?? 0;

  if (count === 0) {
    return NextResponse.json({ needsSetup: true, step: "admin", dbType: getDbConfig().type });
  }

  return NextResponse.json({ needsSetup: false, step: "done" });
});
