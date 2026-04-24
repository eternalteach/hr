import { describe, it, expect, vi } from "vitest";
import { post } from "@/test/helpers";

vi.mock("@/db", () => ({ getDb: vi.fn(), saveDb: vi.fn() }));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("로그아웃 시 쿠키를 삭제하고 ok를 반환한다", async () => {
    const res = await POST(post("/api/auth/logout", {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("taskflow_session");
  });
});
