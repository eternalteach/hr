"use client";

import { DDayBadge, StatusBadge, MemberAvatar } from "@/components/shared/badges";
import { formatRelativeTime } from "@/lib/utils";
import type { Task, ActivityLog } from "@/lib/types";

export function DeadlineList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">이번 주 마감 예정</h3>
      <div className="space-y-2.5">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-1.5">
            {t.due_date && <DDayBadge dueDate={t.due_date} />}
            <span className="text-sm text-gray-900 flex-1 truncate">{t.title}</span>
            <span className="text-xs text-gray-400 shrink-0">{(t as any).assignee_names || ""}</span>
            <StatusBadge status={t.status} />
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">이번 주 마감 업무가 없습니다</p>}
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  created: "업무를 생성했습니다",
  status_changed: "상태를 변경했습니다",
  assigned: "담당자를 변경했습니다",
  commented: "댓글을 남겼습니다",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-500",
  status_changed: "bg-blue-500",
  assigned: "bg-purple-500",
  commented: "bg-amber-500",
};

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 활동</h3>
      <div className="space-y-3">
        {logs.map(log => {
          let detail = "";
          if (log.detail) {
            try {
              const d = JSON.parse(log.detail);
              if (d.from && d.to) detail = `${d.from} → ${d.to}`;
              else if (d.preview) detail = d.preview;
              else if (d.assignee) detail = d.assignee;
            } catch { /* ignore */ }
          }

          return (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${ACTION_COLORS[log.action] || "bg-gray-400"}`} />
                <div className="w-px flex-1 bg-gray-100" />
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{(log as any).member_name}</span>
                  {" "}
                  <span className="text-gray-500">{ACTION_LABELS[log.action] || log.action}</span>
                </p>
                {log.task_id && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(log as any).task_title}
                    {detail && ` · ${detail}`}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">{formatRelativeTime(log.created_at)}</p>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">활동 기록이 없습니다</p>}
      </div>
    </div>
  );
}
