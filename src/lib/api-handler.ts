import { NextResponse } from "next/server";

/**
 * API 라우트 핸들러에 공통 에러 처리를 덧씌운다.
 * throw된 Error는 500으로 직렬화하고 서버 로그에 스택을 남긴다.
 * ApiError를 throw하면 지정 status/message로 응답.
 *
 * 사용:
 *   export const GET = withApiHandler(async (req) => { ... });
 */
export function withApiHandler<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<NextResponse<R>>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, ...(err.code ? { code: err.code } : {}) },
          { status: err.status },
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("[API]", message, err instanceof Error ? err.stack : "");
      return NextResponse.json(
        { error: "서버 오류가 발생했습니다" },
        { status: 500 },
      );
    }
  };
}

/**
 * 클라이언트에게 그대로 노출할 에러 — status/message 지정.
 * `code`를 넣으면 프론트엔드에서 `t(\`error.\${code}\`)`로 다국어 번역 가능.
 * 에러 코드 목록은 src/lib/i18n.ts 참고.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
