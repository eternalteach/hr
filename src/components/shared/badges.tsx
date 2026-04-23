"use client";

import { cn, getDDayLabel, getDDayColor } from "@/lib/utils";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useSettings } from "@/lib/settings-context";

export function PriorityBadge({ priority }: { priority: string }) {
  const { language } = useSettings();
  const config = PRIORITIES.find(p => p.value === priority);
  if (!config) return null;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", config.color)}>
      {language === "en" ? config.label_en : config.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { language } = useSettings();
  const config = TASK_STATUSES.find(s => s.value === status);
  if (!config) return null;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
      {language === "en" ? config.label_en : config.label}
    </span>
  );
}

export function DDayBadge({ dueDate }: { dueDate: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", getDDayColor(dueDate))}>
      {getDDayLabel(dueDate)}
    </span>
  );
}

export function MemberAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-medium shrink-0", sizeClass, colors[colorIndex])}>
      {name.slice(0, 1)}
    </div>
  );
}

export function TagBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + "20", color: color, border: `1px solid ${color}40` }}
    >
      {name}
    </span>
  );
}
