import { getDb } from "@/db";
import { withApiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";

/** 관리자 계정이 하나도 없으면 초기 설정이 필요한 상태 */
export const GET = withApiHandler(async () => {
  const db = await getDb();
  const result = db.exec(
    "SELECT COUNT(*) FROM members WHERE role = 'admin' AND password_hash IS NOT NULL"
  );
  const count = (result[0]?.values[0][0] as number) ?? 0;
  return NextResponse.json({ needsSetup: count === 0 });
});
