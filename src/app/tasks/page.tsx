"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCreateModal } from "@/components/tasks/task-create-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useT, useLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Plus, LayoutGrid, List, Filter, X } from "lucide-react";
import type { Task, Member, Lob, Sow, Brd } from "@/lib/types";

export default function TasksPage() {
  const t = useT();
  const lbl = useLabel();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [filterLob, setFilterLob] = useState("");
  const [filterSow, setFilterSow] = useState("");
  const [filterBrd, setFilterBrd] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [lobs, setLobs] = useState<Lob[]>([]);
  const [sows, setSows] = useState<Sow[]>([]);
  const [brds, setBrds] = useState<Brd[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filterLob) params.set("lob", filterLob);
    if (filterSow) params.set("sow_id", filterSow);
    if (filterBrd) params.set("brd_id", filterBrd);
    if (filterTitle) params.set("title", filterTitle);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterAssignee) params.set("assignee", filterAssignee);
    const res = await fetch(`/api/tasks?${params}`);
    const data: Task[] = await res.json();
    setTasks(data);
    setLoading(false);
    return data;
  }, [filterLob, filterSow, filterBrd, filterTitle, filterStatus, filterPriority, filterAssignee]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // 외부 페이지에서 /tasks?id=N 으로 진입하면 해당 업무 상세 모달을 자동으로 연다
  useEffect(() => {
    if (!deepLinkId) return;
    const id = Number(deepLinkId);
    if (!Number.isInteger(id) || id <= 0) return;
    fetch(`/api/tasks/${id}`).then(r => r.ok ? r.json() : null).then((task: Task | null) => {
      if (task) setSelectedTask(task);
      // URL을 정리해서 다시 닫았다 열어도 모달이 안 다시 뜨도록
      router.replace("/tasks");
    });
  }, [deepLinkId, router]);
  useEffect(() => {
    fetch("/api/members").then(r => r.json()).then(setMembers);
    fetch("/api/lob").then(r => r.json()).then((d: Lob[]) => setLobs(d.filter(l => l.is_active === "Y")));
    fetch("/api/sow").then(r => r.json()).then((d: Sow[]) => setSows(d.filter(s => s.is_active === "Y")));
    fetch("/api/brd").then(r => r.json()).then((d: Brd[]) => setBrds(d.filter(b => b.is_active === "Y")));
  }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const handleUpdate = async (taskId: number, updates: Record<string, unknown>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } as Task : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, ...updates } as Task : null);
    }
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const fresh = await fetchTasks();
      const freshTask = fresh.find(t => t.id === taskId);
      if (freshTask) setSelectedTask(freshTask);
    } catch {
      fetchTasks();
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    handleUpdate(taskId, {
      status: newStatus,
      ...(newStatus === "done" ? { completed_at: new Date().toISOString() } : {}),
    });
  };

  const handleReorder = (items: { id: number; position: number }[]) => {
    setTasks(prev => prev.map(t => {
      const item = items.find(i => i.id === t.id);
      return item ? { ...t, position: item.position } as Task : t;
    }));
    fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => fetchTasks());
  };

  const resetFilters = () => {
    setFilterLob(""); setFilterSow(""); setFilterBrd("");
    setFilterTitle(""); setFilterStatus("");
    setFilterPriority(""); setFilterAssignee("");
  };

  const activeFilters = [filterLob, filterSow, filterBrd, filterTitle, filterStatus, filterPriority, filterAssignee].filter(Boolean).length;

  const filteredSows = filterLob ? sows.filter(s => s.lob === filterLob) : sows;
  const filteredBrds = brds.filter(b =>
    (!filterLob || b.lob === filterLob) &&
    (!filterSow || b.sow_id === filterSow)
  );

  const selectCls = "text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("task.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("task.count", { n: tasks.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
              activeFilters > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            {t("action.filter")}
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{activeFilters}</span>
            )}
          </button>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("kanban")} className={cn("p-2 transition-colors", viewMode === "kanban" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}>
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("task.new_short")}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">LOB</span>
            <select value={filterLob} onChange={e => { setFilterLob(e.target.value); setFilterSow(""); setFilterBrd(""); }} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {lobs.map(l => <option key={l.id} value={l.code}>{l.code}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">SOW</span>
            <select value={filterSow} onChange={e => { setFilterSow(e.target.value); setFilterBrd(""); }} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {filteredSows.map(s => <option key={s.id} value={s.sow_id}>{s.sow_id}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">BRD</span>
            <select value={filterBrd} onChange={e => setFilterBrd(e.target.value)} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {filteredBrds.map(b => <option key={b.id} value={b.id}>{b.brd_id}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("task.name")}</span>
            <div className="relative">
              <input
                value={filterTitle}
                onChange={e => setFilterTitle(e.target.value)}
                placeholder={t("task.search_placeholder")}
                className="text-sm border border-gray-200 rounded-md pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
              />
              {filterTitle && (
                <button onClick={() => setFilterTitle("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("task.status")}</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{lbl(s)}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("task.priority")}</span>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{lbl(p)}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("task.assignees")}</span>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={selectCls}>
              <option value="">{t("common.all")}</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {activeFilters > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 ml-1">
              <X className="w-3 h-3" />
              {t("common.reset")}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">{t("common.loading")}</div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} onTaskClick={setSelectedTask} onReorder={handleReorder} />
        ) : (
          <TaskListView tasks={tasks} onTaskClick={setSelectedTask} />
        )}
      </div>

      <TaskCreateModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      <TaskDetailModal task={selectedTask} onClose={() => { setSelectedTask(null); fetchTasks(); }} onUpdate={handleUpdate} />
    </div>
  );
}
