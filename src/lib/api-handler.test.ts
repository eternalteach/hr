import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { withApiHandler, ApiError } from "./api-handler";

describe("withApiHandler", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("정상 응답을 그대로 반환한다", async () => {
    const handler = withApiHandler(async () => NextResponse.json({ ok: true }));
    const res = await handler();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("ApiError는 지정 status와 message로 직렬화한다", async () => {
    const handler = withApiHandler(async () => {
      throw new ApiError(404, "없음");
    });
    const res = await handler();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "없음" });
  });

  it("ApiError로 400 검증 에러를 낼 수 있다", async () => {
    const handler = withApiHandler(async () => {
      throw new ApiError(400, "제목은 필수입니다");
    });
    const res = await handler();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "제목은 필수입니다" });
  });

  it("일반 Error는 500으로 마스킹하고 서버에만 원본을 남긴다", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withApiHandler(async () => {
      throw new Error("DB connection lost");
    });
    const res = await handler();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("서버 오류가 발생했습니다");
    expect(body.error).not.toContain("DB connection lost");
    expect(spy).toHaveBeenCalled();
  });

  it("비-Error throw도 500으로 처리한다", async () => {
    const handler = withApiHandler(async () => {
      throw "string error";
    });
    const res = await handler();
    expect(res.status).toBe(500);
  });
});
