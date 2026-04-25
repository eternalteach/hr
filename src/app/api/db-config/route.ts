import { setDbConfig, isDbConfigured, type DbType } from "@/db/config";
import { resetAdapter } from "@/db";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

/** DB 설정 저장 (첫 설치 시 1회만 가능) */
export const POST = withApiHandler(async (request: NextRequest) => {
  if (isDbConfigured()) {
    throw new ApiError(403, "DB가 이미 설정되어 있습니다");
  }

  const { type, url } = await request.json() as { type: DbType; url?: string };

  if (type !== "sqlite" && type !== "postgres") {
    throw new ApiError(400, "type은 'sqlite' 또는 'postgres' 이어야 합니다");
  }
  if (type === "postgres" && !url?.trim()) {
    throw new ApiError(400, "PostgreSQL 연결 문자열(url)이 필요합니다");
  }

  if (type === "postgres") {
    // 연결 테스트
    const { PostgresAdapter } = await import("@/db/adapters/postgres");
    const testAdapter = new PostgresAdapter(url!.trim());
    try {
      await testAdapter.queryOne("SELECT 1 AS ok");
    } catch (e) {
      throw new ApiError(400, `PostgreSQL 연결 실패: ${(e as Error).message}`);
    } finally {
      await testAdapter.end();
    }
  }

  setDbConfig({ type, url: type === "postgres" ? url!.trim() : undefined });
  resetAdapter();

  return NextResponse.json({ ok: true });
});
