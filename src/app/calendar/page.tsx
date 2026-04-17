"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, parseISO, startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCHEDULE_TYPES } from "@/lib/constants";
import type { Schedule } from "@/lib/types";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [form, setForm] = useState({ title: "", type: "meeting", start_at: "", end_at: "", location: "" });

  useEffect(() => {
    const from = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");
    fetch(`/api/schedules?from=${from}&to=${to}`).then(r => r.json()).then(setSchedules);
  }, [currentDate]);

  // 월간 캘린더 날짜 배열
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 주간 뷰 날짜 배열
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getSchedulesForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return schedules.filter(s => s.start_at.startsWith(dateStr));
  };

  const typeColors: Record<string, string> = {
    meeting: "bg-purple-100 text-purple-700 border-l-purple-500",
    deadline: "bg-blue-100 text-blue-700 border-l-blue-500",
    milestone: "bg-amber-100 text-amber-700 border-l-amber-500",
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_at) return;
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, created_by: 1 }),
    });
    setShowCreate(false);
    setForm({ title: "", type: "meeting", start_at: "", end_at: "", location: "" });
    // 리로드
    const from = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");
    const res = await fetch(`/api/schedules?from=${from}&to=${to}`);
    setSchedules(await res.json());
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setForm(f => ({ ...f, start_at: dateStr + "T09:00" }));
    setShowCreate(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">캘린더</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate(v => viewMode === "month" ? subMonths(v, 1) : new Date(v.getTime() - 7 * 86400000))} className="p-1.5 rounded-md hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
              {format(currentDate, viewMode === "month" ? "yyyy년 M월" : "yyyy년 M월 d일 주", { locale: ko })}
            </span>
            <button onClick={() => setCurrentDate(v => viewMode === "month" ? addMonths(v, 1) : new Date(v.getTime() + 7 * 86400000))} className="p-1.5 rounded-md hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
              오늘
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("month")} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === "month" ? "bg-gray-100 text-gray-900" : "text-gray-500")}>
              월간
            </button>
            <button onClick={() => setViewMode("week")} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === "week" ? "bg-gray-100 text-gray-900" : "text-gray-500")}>
              주간
            </button>
          </div>
          <button onClick={() => { setForm(f => ({ ...f, start_at: format(new Date(), "yyyy-MM-dd") + "T09:00" })); setShowCreate(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />일정 추가
          </button>
        </div>
      </div>

      {/* 월간 뷰 */}
      {viewMode === "month" && (
        <div className="flex-1 overflow-auto p-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {["일", "월", "화", "수", "목", "금", "토"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 border-t border-l border-gray-200">
            {monthDays.map(day => {
              const daySchedules = getSchedulesForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "border-r border-b border-gray-200 min-h-[100px] p-1.5 cursor-pointer hover:bg-gray-50 transition-colors",
                    !isSameMonth(day, currentDate) && "bg-gray-50/50"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                    isToday(day) ? "bg-blue-600 text-white font-medium" : !isSameMonth(day, currentDate) ? "text-gray-300" : "text-gray-700"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {daySchedules.slice(0, 3).map(s => (
                      <div key={s.id} className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border-l-2 truncate", typeColors[s.type])}>
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
      )}

      {/* 주간 뷰 */}
      {viewMode === "week" && (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map(day => {
              const daySchedules = getSchedulesForDay(day);
              return (
                <div key={day.toISOString()} className="min-h-[400px]">
                  <div className={cn(
                    "text-center py-2 mb-2 rounded-lg",
                    isToday(day) ? "bg-blue-600 text-white" : "bg-gray-50"
                  )}>
                    <p className="text-xs text-current opacity-70">{format(day, "EEE", { locale: ko })}</p>
                    <p className="text-lg font-semibold">{format(day, "d")}</p>
                  </div>
                  <div className="space-y-1.5">
                    {daySchedules.map(s => (
                      <div key={s.id} className={cn("p-2 rounded-lg border-l-2 text-xs", typeColors[s.type])}>
                        <p className="font-medium truncate">{s.title}</p>
                        {s.end_at && (
                          <p className="opacity-70 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(s.start_at), "HH:mm")} - {format(parseISO(s.end_at), "HH:mm")}
                          </p>
                        )}
                        {s.location && (
                          <p className="opacity-70 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{s.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 일정 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">새 일정</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                <div className="flex gap-2">
                  {SCHEDULE_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border", form.type === t.value ? t.color + " ring-1" : "border-gray-200 text-gray-500")}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
                  <input type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
                  <input type="datetime-local" value={form.end_at} onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {form.type === "meeting" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="회의실, 온라인 등" />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                <button type="submit" disabled={!form.title || !form.start_at} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">만들기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
