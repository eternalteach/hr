export const TASK_STATUSES = [
  { value: "todo" as const, label: "할 일", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress" as const, label: "진행 중", color: "bg-blue-100 text-blue-700" },
  { value: "review" as const, label: "리뷰", color: "bg-amber-100 text-amber-700" },
  { value: "done" as const, label: "완료", color: "bg-green-100 text-green-700" },
];

export const PRIORITIES = [
  { value: "urgent" as const, label: "긴급", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "high" as const, label: "높음", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "medium" as const, label: "보통", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "low" as const, label: "낮음", color: "bg-gray-100 text-gray-600 border-gray-300" },
];

export const SCHEDULE_TYPES = [
  { value: "meeting" as const, label: "회의", color: "bg-purple-100 text-purple-700" },
  { value: "deadline" as const, label: "마감일", color: "bg-blue-100 text-blue-700" },
  { value: "milestone" as const, label: "마일스톤", color: "bg-amber-100 text-amber-700" },
];

export const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "LayoutDashboard" },
  { href: "/tasks", label: "업무 관리", icon: "CheckSquare" },
  { href: "/calendar", label: "캘린더", icon: "Calendar" },
  { href: "/members", label: "팀원 관리", icon: "Users" },
] as const;
