"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PriorityData } from "@/lib/types";

const COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#9ca3af",
};

const LABELS: Record<string, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export function PriorityChart({ data }: { data: PriorityData[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">우선순위 분포</h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={data} dataKey="count" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {data.map((d) => (
                  <Cell key={d.priority} fill={COLORS[d.priority] || "#9ca3af"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, _: any, entry: any) => [value, LABELS[entry.payload.priority]]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-semibold text-gray-900">{total}</span>
              <p className="text-xs text-gray-400">전체</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {data.map(d => (
            <div key={d.priority} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[d.priority] }} />
              <span className="text-sm text-gray-600">{LABELS[d.priority]}</span>
              <span className="text-sm font-medium text-gray-900 ml-auto">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
