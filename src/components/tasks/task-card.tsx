"use client";

import { cn } from "@/lib/utils";
import { PriorityBadge, DDayBadge, MemberAvatar, TagBadge } from "@/components/shared/badges";
import { MessageSquare } from "lucide-react";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        "bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
        isOverdue ? "border-red-200 border-l-red-500 border-l-2" : "border-gray-200"
      )}
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        {task.due_date && <DDayBadge dueDate={task.due_date} />}
      </div>

      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">{task.title}</h4>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tt) => (
            <TagBadge key={tt.tag_id} name={tt.name || tt.tag?.name || ""} color={tt.color || tt.tag?.color || "#6366f1"} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex -space-x-1.5">
          {task.assignees?.slice(0, 3).map((a) => (
            <MemberAvatar
              key={a.member_id || a.id}
              name={a.member?.name || a.member_name || "?"}
              size="sm"
            />
          ))}
          {(task.assignees?.length || 0) > 3 && (
            <span className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
              +{(task.assignees?.length || 0) - 3}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          {(task.comment_count || 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" />
              {task.comment_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
