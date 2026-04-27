export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type Priority = "urgent" | "high" | "medium" | "low";
export type MemberRole = "admin" | "leader" | "member";
export type ScheduleType = "meeting" | "deadline" | "milestone";

export interface Member {
  id: number;
  /** 로컬 언어 이름 — 신규 입력은 항상 채워짐 */
  name: string;
  /** 영문 이름 — 신규 입력은 항상 채워지나, 마이그레이션 이전 행은 null일 수 있음 */
  name_en: string | null;
  email: string;
  avatar_url: string | null;
  lob: string | null;
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
  brd_id: number | null;
  created_by: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assignees?: TaskAssignee[];
  tags?: TaskTagJoin[];
  comment_count?: number;
  attachment_count?: number;
  position?: number;
  /** API JOIN 응답에서 평탄화된 필드 */
  assignee_names?: string | null;
  // BRD 조인 필드 (API 응답에서 함께 제공)
  brd_code?: string | null;
  brd_lob?: string | null;
  brd_sow_id?: string | null;
  brd_title_local?: string | null;
  brd_title_en?: string | null;
}

export interface TaskAssignee {
  id: number;
  task_id: number;
  member_id: number;
  assigned_at: string;
  member?: Member;
  /** API JOIN 응답에서 평탄화된 필드 */
  member_name?: string;
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
  /** API JOIN 응답에서 평탄화된 필드 */
  name?: string;
  color?: string;
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
  /** API JOIN 응답에서 평탄화된 필드 */
  member_name?: string;
  task_title?: string;
}

export interface Sow {
  id: number;
  sow_id: string;
  lob: string | null;
  title_local: string | null;
  title_en: string | null;
  content_local: string;
  content_en: string;
  note_local: string | null;
  note_en: string | null;
  milestone: string | null;
  is_active: "Y" | "N";
  data_language: "en" | "local" | null;
  updated_at: string;
  created_at: string;
}

export interface Lob {
  id: number;
  code: string;
  title_local: string | null;
  title_en: string | null;
  content_local: string | null;
  content_en: string | null;
  note_local: string | null;
  note_en: string | null;
  is_active: "Y" | "N";
  data_language: "en" | "local" | null;
  updated_at: string;
  created_at: string;
}

export interface CommonCode {
  id: number;
  code_group: string;
  code: string;
  title_local: string | null;
  title_en: string | null;
  content_local: string | null;
  content_en: string | null;
  note_local: string | null;
  note_en: string | null;
  is_active: "Y" | "N";
  data_language: "en" | "local" | null;
  updated_at: string;
  created_at: string;
}

export type BoardType = "glossary" | "meeting-notes";

/** 통합 게시판 레코드 — board_type으로 용어정의/회의록 등을 구분 */
export interface Post {
  id: number;
  board_type: BoardType;
  lob: string | null;
  title_local: string;
  title_en: string | null;
  content_local: string | null;
  content_en: string | null;
  note_local: string | null;
  note_en: string | null;
  /** ISO date (YYYY-MM-DD) — 회의록처럼 날짜가 필요한 게시판용. 없는 보드는 null */
  reference_date: string | null;
  is_active: "Y" | "N";
  data_language: "en" | "local" | null;
  updated_at: string;
  created_at: string;
  /** 회의록 등 task 링크가 있는 보드용 진행률 — list GET에서만 채워짐 */
  linked_tasks_total?: number;
  linked_tasks_done?: number;
}

export interface Brd {
  id: number;
  brd_id: string;
  sow_id: string;
  lob: string | null;
  title_local: string | null;
  title_en: string | null;
  content_local: string;
  content_en: string;
  note_local: string | null;
  note_en: string | null;
  is_active: "Y" | "N";
  data_language: "en" | "local" | null;
  updated_at: string;
  created_at: string;
}

/** 첨부파일 owner 종류 — 새 도메인 추가 시 여기에 추가 */
export type AttachmentOwnerType = "board_post";

export interface Attachment {
  id: number;
  owner_type: AttachmentOwnerType;
  owner_id: number;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by: number | null;
  uploaded_at: string;
}

/** 회의록 상세에서 보여줄 연관 업무 요약 — `/api/board/[type]/[id]/links` GET 응답 */
export interface LinkedTaskSummary {
  id: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  brd_id: number | null;
  brd_code: string | null;
  brd_lob: string | null;
  brd_title_local: string | null;
  brd_title_en: string | null;
  assignees: { member_id: number; member_name: string }[];
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
