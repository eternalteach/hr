import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./crypto";

describe("hashPassword", () => {
  it("비밀번호를 해시로 변환한다", () => {
    const hash = hashPassword("password123");
    expect(typeof hash).toBe("string");
    expect(hash).toContain(":");
  });

  it("같은 비밀번호도 호출마다 다른 해시를 생성한다 (salt 때문에)", () => {
    const hash1 = hashPassword("same-password");
    const hash2 = hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
  });

  it("salt:hash 형식으로 반환한다", () => {
    const hash = hashPassword("test");
    const parts = hash.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(128); // 64 bytes = 128 hex chars
  });
});

describe("verifyPassword", () => {
  it("올바른 비밀번호는 true를 반환한다", () => {
    const password = "correct-password";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("잘못된 비밀번호는 false를 반환한다", () => {
    const hash = hashPassword("correct-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("빈 문자열 비밀번호는 false를 반환한다", () => {
    const hash = hashPassword("some-password");
    expect(verifyPassword("", hash)).toBe(false);
  });

  it("잘못된 형식의 stored 값은 false를 반환한다", () => {
    expect(verifyPassword("password", "invalid-format")).toBe(false);
  });

  it("salt 없는 stored 값은 false를 반환한다", () => {
    expect(verifyPassword("password", ":onlyhash")).toBe(false);
  });
});
