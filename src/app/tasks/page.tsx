"use client";

import { useState, useEffect, useCallback } from "react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCreateModal } from "@/components/tasks/task-create-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Plus, LayoutGrid, List, Filter, X } from "lucide-react";
import type { Task, Member, Lob, Sow, Brd } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // 필터 상태 (순서: LOB → SOW → BRD → 업무명 → 상태 → 우선순위 → 담당자)
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
    // 낙관적 업데이트 (즉각적인 UI 반응)
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
      // PATCH 성공 후 전체 재조회 — BRD JOIN 필드(brd_code, brd_lob 등)를 포함한 최신 데이터로 갱신
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

  // 캐스케이드 필터 — LOB/SOW 선택에 따라 하위 목록 좁힘
  const filteredSows = filterLob ? sows.filter(s => s.lob === filterLob) : sows;
  const filteredBrds = brds.filter(b =>
    (!filterLob || b.lob === filterLob) &&
    (!filterSow || b.sow_id === filterSow)
  );

  const selectCls = "text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">업무 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length}개의 업무</p>
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
            필터
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{activeFilters}</span>
            )}
          </button>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn("p-2 transition-colors", viewMode === "kanban" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 transition-colors", viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 업무
          </button>
        </div>
      </div>

      {/* 필터 바 */}
      {showFilters && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* LOB */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">LOB</span>
            <select
              value={filterLob}
              onChange={e => { setFilterLob(e.target.value); setFilterSow(""); setFilterBrd(""); }}
              className={selectCls}
            >
              <option value="">전체</option>
              {lobs.map(l => <option key={l.id} value={l.code}>{l.code}</option>)}
            </select>
          </div>

          {/* SOW */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">SOW</span>
            <select
              value={filterSow}
              onChange={e => { setFilterSow(e.target.value); setFilterBrd(""); }}
              className={selectCls}
            >
              <option value="">전체</option>
              {filteredSows.map(s => <option key={s.id} value={s.sow_id}>{s.sow_id}</option>)}
            </select>
          </div>

          {/* BRD */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">BRD</span>
            <select
              value={filterBrd}
              onChange={e => setFilterBrd(e.target.value)}
              className={selectCls}
            >
              <option value="">전체</option>
              {filteredBrds.map(b => <option key={b.id} value={b.id}>{b.brd_id}</option>)}
            </select>
          </div>

          {/* 업무명 LIKE 검색 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">업무명</span>
            <div className="relative">
              <input
                value={filterTitle}
                onChange={e => setFilterTitle(e.target.value)}
                placeholder="검색…"
                className="text-sm border border-gray-200 rounded-md pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
              />
              {filterTitle && (
                <button onClick={() => setFilterTitle("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 상태 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">상태</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={selectCls}
            >
              <option value="">전체</option>
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* 우선순위 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">우선순위</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className={selectCls}
            >
              <option value="">전체</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* 담당자 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">담당자</span>
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className={selectCls}
            >
              <option value="">전체</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {activeFilters > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 ml-1">
              <X className="w-3 h-3" />
              초기화
            </button>
          )}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">로딩 중...</div>
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
