"use client";

import { DDayBadge, StatusBadge, MemberAvatar } from "@/components/shared/badges";
import { formatRelativeTime } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n";
import type { Task, ActivityLog } from "@/lib/types";

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-500",
  status_changed: "bg-blue-500",
  assigned: "bg-purple-500",
  commented: "bg-amber-500",
};

export function DeadlineList({ tasks }: { tasks: Task[] }) {
  const t = useT();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 shrink-0">{t("dashboard.upcoming_deadlines")}</h3>
      <div className="overflow-y-auto max-h-64 space-y-2.5 pr-1">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 py-1.5">
            {task.due_date && <DDayBadge dueDate={task.due_date} />}
            <span className="text-sm text-gray-900 flex-1 truncate">{task.title}</span>
            <span className="text-xs text-gray-400 shrink-0">{(task as any).assignee_names || ""}</span>
            <StatusBadge status={task.status} />
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t("dashboard.no_deadlines")}</p>}
      </div>
    </div>
  );
}

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  const { timezone } = useSettings();
  const t = useT();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 shrink-0">{t("dashboard.recent_activity")}</h3>
      <div className="overflow-y-auto max-h-64 space-y-3 pr-1">
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

          const actionKey = `dashboard.action.${log.action}` as const;

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
                  <span className="text-gray-500">{t(actionKey) || log.action}</span>
                </p>
                {log.task_id && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(log as any).task_title}
                    {detail && ` · ${detail}`}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">{formatRelativeTime(log.created_at, timezone)}</p>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t("dashboard.no_activity")}</p>}
      </div>
    </div>
  );
}
