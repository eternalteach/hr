"use client";

import { PriorityBadge, StatusBadge, DDayBadge, MemberAvatar } from "@/components/shared/badges";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-500 w-[40%]">업무</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">상태</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">우선순위</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">담당자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">마감일</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900">{task.title}</span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <div className="flex -space-x-1">
                  {task.assignees?.slice(0, 2).map(a => (
                    <MemberAvatar
                      key={a.member_id || a.id}
                      name={a.member?.name || (a as any).member_name || "?"}
                      size="sm"
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                {task.due_date ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{formatDate(task.due_date)}</span>
                    <DDayBadge dueDate={task.due_date} />
                  </div>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                업무가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
