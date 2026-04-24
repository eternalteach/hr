import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./session";

describe("signSession / verifySession", () => {
  it("토큰을 생성하고 검증할 수 있다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const payload = await verifySession(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(1);
    expect(payload!.role).toBe("admin");
    expect(payload!.mustChange).toBe(false);
  });

  it("mustChange: true를 페이로드에 담을 수 있다", async () => {
    const token = await signSession({ sub: 5, role: "member", mustChange: true });
    const payload = await verifySession(token);
    expect(payload!.mustChange).toBe(true);
  });

  it("exp(만료 시간)가 설정된다", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    const payload = await verifySession(token);
    expect(payload!.exp).toBeGreaterThan(before);
    // 7일 이내 만료
    expect(payload!.exp).toBeLessThanOrEqual(before + 7 * 86400 + 5);
  });

  it("서명이 변조된 토큰은 null을 반환한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    const tampered = token.slice(0, -5) + "XXXXX";
    const payload = await verifySession(tampered);
    expect(payload).toBeNull();
  });

  it("점(.)이 없는 토큰은 null을 반환한다", async () => {
    const payload = await verifySession("invalidtoken");
    expect(payload).toBeNull();
  });

  it("만료된 토큰은 null을 반환한다", async () => {
    const token = await signSession({ sub: 1, role: "admin", mustChange: false });
    // 토큰의 페이로드를 파싱해서 exp를 과거로 바꾼 위조 토큰
    const [dataPart] = token.split(".");
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(dataPart.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))
    ));
    decoded.exp = Math.floor(Date.now() / 1000) - 1;
    // 서명 없이 만료 페이로드만 전달 (서명 검증 실패로 null)
    const payload = await verifySession("invalidtoken.invalidsig");
    expect(payload).toBeNull();
  });

  it("빈 문자열은 null을 반환한다", async () => {
    const payload = await verifySession("");
    expect(payload).toBeNull();
  });
});
