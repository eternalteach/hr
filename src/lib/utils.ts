import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, differenceInHours, differenceInMinutes, parseISO, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 상대 시간 포맷 — 활동 로그, 댓글 등에서 사용 */
export function formatRelativeTime(isoString: string): string {
  const date = parseISO(isoString);
  const now = new Date();
  const mins = differenceInMinutes(now, date);
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);

  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return format(date, "M월 d일");
}

/** D-day 라벨 생성 */
export function getDDayLabel(dueDate: string): string {
  const diff = differenceInDays(parseISO(dueDate), new Date());
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** D-day 색상 클래스 */
export function getDDayColor(dueDate: string): string {
  const diff = differenceInDays(parseISO(dueDate), new Date());
  if (diff < 0) return "bg-red-100 text-red-700 border-red-200";
  if (diff <= 1) return "bg-red-100 text-red-700 border-red-200";
  if (diff <= 3) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), "M월 d일");
}

export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), "M월 d일 HH:mm");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
