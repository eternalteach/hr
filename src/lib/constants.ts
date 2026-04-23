export const TASK_STATUSES = [
  { value: "todo" as const, label: "할 일", label_en: "To Do", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress" as const, label: "진행 중", label_en: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "review" as const, label: "리뷰", label_en: "Review", color: "bg-amber-100 text-amber-700" },
  { value: "done" as const, label: "완료", label_en: "Done", color: "bg-green-100 text-green-700" },
];

export const PRIORITIES = [
  { value: "urgent" as const, label: "긴급", label_en: "Urgent", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "high" as const, label: "높음", label_en: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "medium" as const, label: "보통", label_en: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "low" as const, label: "낮음", label_en: "Low", color: "bg-gray-100 text-gray-600 border-gray-300" },
];

export const SCHEDULE_TYPES = [
  { value: "meeting" as const, label: "회의", label_en: "Meeting", color: "bg-purple-100 text-purple-700" },
  { value: "deadline" as const, label: "마감일", label_en: "Deadline", color: "bg-blue-100 text-blue-700" },
  { value: "milestone" as const, label: "마일스톤", label_en: "Milestone", color: "bg-amber-100 text-amber-700" },
];

export const MEMBER_ROLES = [
  { value: "admin" as const, label: "관리자", label_en: "Admin" },
  { value: "leader" as const, label: "리더", label_en: "Leader" },
  { value: "member" as const, label: "팀원", label_en: "Member" },
];

export const NAV_ITEMS = [
  { href: "/", label: "대시보드", label_en: "Dashboard", icon: "LayoutDashboard" },
  { href: "/tasks", label: "업무 관리", label_en: "Tasks", icon: "CheckSquare" },
  { href: "/calendar", label: "캘린더", label_en: "Calendar", icon: "Calendar" },
  { href: "/members", label: "팀원 관리", label_en: "Members", icon: "Users" },
] as const;
