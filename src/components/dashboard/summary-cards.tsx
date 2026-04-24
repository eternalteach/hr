"use client";

import { cn } from "@/lib/utils";
import { ClipboardList, Loader, CheckCircle, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { DashboardSummary } from "@/lib/types";

const CARD_DEFS = [
  { key: "totalTasks",         labelKey: "dashboard.total_tasks",        icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
  { key: "inProgress",         labelKey: "dashboard.in_progress",        icon: Loader,        color: "text-amber-600 bg-amber-50" },
  { key: "completedThisWeek",  labelKey: "dashboard.completed_this_week", icon: CheckCircle,   color: "text-green-600 bg-green-50" },
  { key: "overdue",            labelKey: "dashboard.overdue",            icon: AlertTriangle, color: "text-red-600 bg-red-50" },
] as const;

export function SummaryCards({ data }: { data: DashboardSummary | null }) {
  const t = useT();
  return (
    <div className="grid grid-cols-4 gap-4">
      {CARD_DEFS.map(card => {
        const Icon = card.icon;
        const value = data ? data[card.key as keyof DashboardSummary] : "-";
        return (
          <div key={card.key} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t(card.labelKey)}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
