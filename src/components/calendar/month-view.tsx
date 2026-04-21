"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/lib/types";
import { SCHEDULE_TYPE_COLORS } from "./constants";

interface Props {
  days: Date[];
  currentDate: Date;
  getSchedulesForDay: (date: Date) => Schedule[];
  onDayClick?: (date: Date) => void;
  onScheduleClick?: (schedule: Schedule) => void;
}

export function MonthView({ days, currentDate, getSchedulesForDay, onDayClick, onScheduleClick }: Props) {
  return (
    <div className="flex-1 overflow-auto p-6">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {days.map(day => {
          const daySchedules = getSchedulesForDay(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={cn(
                "border-r border-b border-gray-200 min-h-[100px] p-1.5 transition-colors",
                onDayClick ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
                !isSameMonth(day, currentDate) && "bg-gray-50/50"
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                isToday(day) ? "bg-blue-600 text-white font-medium"
                  : !isSameMonth(day, currentDate) ? "text-gray-300"
                  : "text-gray-700"
              )}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {daySchedules.slice(0, 3).map(s => (
                  <div
                    key={s.id}
                    onClick={onScheduleClick ? e => { e.stopPropagation(); onScheduleClick(s); } : undefined}
                    className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border-l-2 truncate", SCHEDULE_TYPE_COLORS[s.type], onScheduleClick && "cursor-pointer hover:brightness-95")}
                  >
                    {s.title}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <span className="text-[10px] text-gray-400 pl-1">+{daySchedules.length - 3}개</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
