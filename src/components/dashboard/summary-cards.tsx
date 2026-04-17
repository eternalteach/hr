"use client";

import { cn } from "@/lib/utils";
import { ClipboardList, Loader, CheckCircle, AlertTriangle } from "lucide-react";
import type { DashboardSummary } from "@/lib/types";

const cards = [
  { key: "totalTasks", label: "전체 업무", icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
  { key: "inProgress", label: "진행 중", icon: Loader, color: "text-amber-600 bg-amber-50" },
  { key: "completedThisWeek", label: "이번 주 완료", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  { key: "overdue", label: "지연", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
] as const;

export function SummaryCards({ data }: { data: DashboardSummary | null }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        const value = data ? data[card.key as keyof DashboardSummary] : "-";
        return (
          <div key={card.key} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
