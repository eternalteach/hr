export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type Priority = "urgent" | "high" | "medium" | "low";
export type MemberRole = "admin" | "member";
export type ScheduleType = "meeting" | "deadline" | "milestone";

export interface Member {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: MemberRole;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  created_by: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assignees?: TaskAssignee[];
  tags?: TaskTagJoin[];
  comment_count?: number;
  attachment_count?: number;
  position?: number;
}

export interface TaskAssignee {
  id: number;
  task_id: number;
  member_id: number;
  assigned_at: string;
  member?: Member;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface TaskTagJoin {
  task_id: number;
  tag_id: number;
  tag?: Tag;
}

export interface Comment {
  id: number;
  task_id: number;
  member_id: number;
  content: string;
  created_at: string;
  member?: Member;
}

export interface Schedule {
  id: number;
  title: string;
  type: ScheduleType;
  start_at: string;
  end_at: string | null;
  location: string | null;
  task_id: number | null;
  created_by: number | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  task_id: number | null;
  member_id: number | null;
  action: string;
  detail: string | null;
  created_at: string;
  member?: Member;
  task?: Task;
}

export interface Sow {
  id: number;
  sow_id: string;
  lob: string | null;
  title_ko: string | null;
  title_en: string | null;
  content_ko: string;
  content_en: string;
  note_ko: string | null;
  note_en: string | null;
  milestone: string | null;
  is_active: "Y" | "N";
  updated_at: string;
  created_at: string;
}

export interface DashboardSummary {
  totalTasks: number;
  inProgress: number;
  completedThisWeek: number;
  overdue: number;
}

export interface WorkloadData {
  id: number;
  name: string;
  completed: number;
  in_progress: number;
  overdue: number;
}

export interface PriorityData {
  priority: Priority;
  count: number;
}
