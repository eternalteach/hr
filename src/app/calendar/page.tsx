"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/lib/types";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { ScheduleFormModal, type ScheduleFormState } from "@/components/calendar/schedule-form-modal";
import { ScheduleEditModal } from "@/components/calendar/schedule-edit-modal";

const WEEK_MS = 7 * 86400000;
const EMPTY_FORM: ScheduleFormState = { title: "", type: "meeting", start_at: "", end_at: "", location: "" };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);

  const loadSchedules = useCallback(async () => {
    // 월간 뷰 밖의 날짜도 간혹 보이므로 ±1개월 여유
    const from = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");
    const res = await fetch(`/api/schedules?from=${from}&to=${to}`);
    setSchedules(await res.json());
  }, [currentDate]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getSchedulesForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return schedules.filter(s => s.start_at.startsWith(dateStr));
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
    setForm(EMPTY_FORM);
    loadSchedules();
  };

  const openForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setForm({ ...EMPTY_FORM, start_at: dateStr + "T09:00" });
    setShowCreate(true);
  };

  const openForToday = () => {
    setForm({ ...EMPTY_FORM, start_at: format(new Date(), "yyyy-MM-dd") + "T09:00" });
    setShowCreate(true);
  };

  const navigate = (dir: -1 | 1) =>
    setCurrentDate(v => viewMode === "month"
      ? (dir === -1 ? subMonths(v, 1) : addMonths(v, 1))
      : new Date(v.getTime() + dir * WEEK_MS));

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">캘린더</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
              {format(currentDate, viewMode === "month" ? "yyyy년 M월" : "yyyy년 M월 d일 주", { locale: ko })}
            </span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-md hover:bg-gray-100">
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
          <button onClick={openForToday} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />일정 추가
          </button>
        </div>
      </div>

      {viewMode === "month"
        ? <MonthView days={monthDays} currentDate={currentDate} getSchedulesForDay={getSchedulesForDay} onDayClick={openForDay} onScheduleClick={setEditTarget} />
        : <WeekView days={weekDays} getSchedulesForDay={getSchedulesForDay} onScheduleClick={setEditTarget} />
      }

      <ScheduleFormModal
        open={showCreate}
        form={form}
        onChange={setForm}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      {editTarget && (
        <ScheduleEditModal
          schedule={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => {
            setSchedules(ss => ss.map(s => s.id === updated.id ? updated : s));
            setEditTarget(null);
          }}
          onDeleted={id => {
            setSchedules(ss => ss.filter(s => s.id !== id));
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
