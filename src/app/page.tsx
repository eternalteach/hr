"use client";

import { useState, useEffect, useCallback } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { WorkloadChart } from "@/components/dashboard/workload-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { DeadlineList, ActivityFeed } from "@/components/dashboard/deadline-activity";
import { useT } from "@/lib/i18n";
import type { DashboardSummary, WorkloadData, PriorityData, Task, ActivityLog } from "@/lib/types";

export default function DashboardPage() {
  const t = useT();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [workload, setWorkload] = useState<WorkloadData[]>([]);
  const [priority, setPriority] = useState<PriorityData[]>([]);
  const [deadlines, setDeadlines] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [seeded, setSeeded] = useState(false);

  const loadData = useCallback(async () => {
    const [s, w, p, d, l] = await Promise.all([
      fetch("/api/dashboard/summary").then(r => r.json()),
      fetch("/api/dashboard/workload").then(r => r.json()),
      fetch("/api/dashboard/priority").then(r => r.json()),
      fetch("/api/dashboard/deadlines").then(r => r.json()),
      fetch("/api/activity-logs").then(r => r.json()),
    ]);
    setSummary(s);
    setWorkload(w);
    setPriority(p);
    setDeadlines(d);
    setLogs(l);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/members");
        const members = await res.json();
        if (!members.length) {
          await fetch("/api/seed", { method: "POST" });
          setSeeded(true);
          return;
        }
      } catch {
        await fetch("/api/seed", { method: "POST" });
        setSeeded(true);
        return;
      }
      loadData();
    }
    init();
  }, [loadData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (seeded) loadData();
  }, [seeded, loadData]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("dashboard.subtitle")}</p>
      </div>
      <SummaryCards data={summary} />
      <div className="grid grid-cols-2 gap-4">
        <WorkloadChart data={workload} />
        <PriorityChart data={priority} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DeadlineList tasks={deadlines} />
        <ActivityFeed logs={logs} />
      </div>
    </div>
  );
}
