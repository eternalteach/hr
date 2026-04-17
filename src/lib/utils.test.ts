import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  cn,
  formatRelativeTime,
  getDDayLabel,
  getDDayColor,
  formatDate,
  formatDateTime,
  toISODate,
} from "./utils";

describe("cn", () => {
  it("중복 tailwind 클래스를 뒤의 값으로 병합한다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("falsy 값을 제거한다", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("날짜 유틸 — 고정 시간 2026-04-17 12:00", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  describe("formatRelativeTime", () => {
    it("1분 미만은 '방금 전'", () => {
      expect(formatRelativeTime("2026-04-17T11:59:30Z")).toBe("방금 전");
    });
    it("1시간 미만은 분 단위", () => {
      expect(formatRelativeTime("2026-04-17T11:30:00Z")).toBe("30분 전");
    });
    it("24시간 미만은 시간 단위", () => {
      expect(formatRelativeTime("2026-04-17T06:00:00Z")).toBe("6시간 전");
    });
    it("7일 미만은 일 단위", () => {
      expect(formatRelativeTime("2026-04-14T12:00:00Z")).toBe("3일 전");
    });
    it("7일 이상은 '월 일' 포맷", () => {
      expect(formatRelativeTime("2026-04-01T12:00:00Z")).toBe("4월 1일");
    });
  });

  describe("getDDayLabel", () => {
    it("오늘은 D-Day", () => {
      expect(getDDayLabel("2026-04-17")).toBe("D-Day");
    });
    it("미래는 D- 접두사", () => {
      expect(getDDayLabel("2026-04-20")).toBe("D-3");
    });
    it("과거는 D+ 접두사", () => {
      expect(getDDayLabel("2026-04-15")).toBe("D+2");
    });
  });

  describe("getDDayColor", () => {
    it("지난 마감은 빨강", () => {
      expect(getDDayColor("2026-04-10")).toContain("red");
    });
    it("D-1 이내는 빨강", () => {
      expect(getDDayColor("2026-04-18")).toContain("red");
    });
    it("D-2~3은 호박색", () => {
      expect(getDDayColor("2026-04-19")).toContain("amber");
      expect(getDDayColor("2026-04-20")).toContain("amber");
    });
    it("D-4 이상은 파랑", () => {
      expect(getDDayColor("2026-04-25")).toContain("blue");
    });
  });

  describe("formatDate / formatDateTime / toISODate", () => {
    it("formatDate는 'M월 d일'", () => {
      expect(formatDate("2026-04-17T00:00:00Z")).toBe("4월 17일");
    });
    it("formatDateTime은 'M월 d일 HH:mm'", () => {
      expect(formatDateTime("2026-04-17T15:30:00")).toBe("4월 17일 15:30");
    });
    it("toISODate는 yyyy-MM-dd", () => {
      expect(toISODate(new Date("2026-04-17T15:30:00"))).toBe("2026-04-17");
    });
  });
});
