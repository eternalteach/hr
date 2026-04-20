"use client";

import { format, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/lib/types";
import { SCHEDULE_TYPE_COLORS } from "./constants";

interface Props {
  days: Date[];
  getSchedulesForDay: (date: Date) => Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
}

export function WeekView({ days, getSchedulesForDay, onScheduleClick }: Props) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-7 gap-3">
        {days.map(day => {
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
                  <div
                    key={s.id}
                    onClick={() => onScheduleClick(s)}
                    className={cn("p-2 rounded-lg border-l-2 text-xs cursor-pointer hover:brightness-95", SCHEDULE_TYPE_COLORS[s.type])}
                  >
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
  );
}
