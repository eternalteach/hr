"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskCard } from "./task-card";
import { TASK_STATUSES } from "@/lib/constants";
import { useLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: number, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onReorder: (items: { id: number; position: number }[]) => void;
}

export function KanbanBoard({ tasks, onStatusChange, onTaskClick, onReorder }: KanbanBoardProps) {
  const lbl = useLabel();
  // position 기준 오름차순 정렬
  const sorted = TASK_STATUSES.reduce((acc, status) => {
    acc[status.value] = tasks
      .filter(t => t.status === status.value)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = parseInt(draggableId);

    if (source.droppableId === destination.droppableId) {
      // 같은 컬럼 내 순서 변경
      const col = [...sorted[source.droppableId]];
      const [moved] = col.splice(source.index, 1);
      col.splice(destination.index, 0, moved);
      onReorder(col.map((t, i) => ({ id: t.id, position: i * 1000 })));
    } else {
      // 다른 컬럼으로 이동: 상태 변경 + 목적지 컬럼 position 재계산
      const destCol = sorted[destination.droppableId].slice();
      destCol.splice(destination.index, 0, tasks.find(t => t.id === taskId)!);
      onStatusChange(taskId, destination.droppableId);
      onReorder(destCol.map((t, i) => ({ id: t.id, position: i * 1000 })));
    }
  };

  const columnColors: Record<string, string> = {
    todo: "border-t-gray-400",
    in_progress: "border-t-blue-500",
    review: "border-t-amber-500",
    done: "border-t-green-500",
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full pb-4">
        {TASK_STATUSES.map(status => (
          <Droppable key={status.value} droppableId={status.value}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex-1 min-w-[260px] rounded-xl border-t-2 bg-gray-50/80 flex flex-col",
                  columnColors[status.value],
                  snapshot.isDraggingOver && "bg-blue-50/50"
                )}
              >
                {/* 컬럼 헤더 */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">{lbl(status)}</h3>
                    <span className="text-xs font-medium text-gray-400 bg-gray-200/70 rounded-full px-2 py-0.5">
                      {sorted[status.value].length}
                    </span>
                  </div>
                </div>

                {/* 카드 목록 */}
                <div className="flex-1 overflow-auto px-2 pb-2 space-y-2">
                  {sorted[status.value].map((task, index) => (
                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(snapshot.isDragging && "rotate-2 shadow-lg")}
                        >
                          <TaskCard task={task} onClick={onTaskClick} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
