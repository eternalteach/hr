"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { WorkloadData } from "@/lib/types";

export function WorkloadChart({ data }: { data: WorkloadData[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">팀원별 업무 현황</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 12, fill: "#9ca3af" }} />
          <YAxis dataKey="name" type="category" width={55} tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = { completed: "완료", in_progress: "진행", overdue: "지연" };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = { completed: "완료", in_progress: "진행", overdue: "지연" };
              return <span style={{ fontSize: 12, color: "#6b7280" }}>{labels[value] || value}</span>;
            }}
          />
          <Bar dataKey="completed" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
          <Bar dataKey="in_progress" stackId="a" fill="#fbbf24" />
          <Bar dataKey="overdue" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
