"use client";

import { useCallback } from "react";
import { useSettings } from "./settings-context";

type Lang = "local" | "en";

const dict: Record<Lang, Record<string, string>> = {
  local: {
    // Navigation
    "nav.dashboard": "대시보드",
    "nav.tasks": "업무 관리",
    "nav.calendar": "캘린더",
    "nav.members": "팀원 관리",
    "nav.lob": "LOB 관리",
    "nav.sow": "SOW",
    "nav.brd": "BRD",
    "nav.codes": "공통코드",
    "nav.glossary": "용어정의",
    "nav.meeting_notes": "회의록",
    "nav.settings": "설정",

    // Actions
    "action.save": "저장",
    "action.cancel": "취소",
    "action.delete": "삭제",
    "action.edit": "수정",
    "action.add": "추가",
    "action.create": "생성",
    "action.search": "검색",
    "action.filter": "필터",
    "action.close": "닫기",
    "action.confirm": "확인",
    "action.upload": "업로드",
    "action.download": "다운로드",
    "action.import": "가져오기",

    // Task status
    "status.todo": "할 일",
    "status.in_progress": "진행 중",
    "status.review": "리뷰",
    "status.done": "완료",
    "status.active": "활성",
    "status.inactive": "비활성",

    // Priority
    "priority.urgent": "긴급",
    "priority.high": "높음",
    "priority.medium": "보통",
    "priority.low": "낮음",

    // Schedule type
    "schedule.meeting": "회의",
    "schedule.deadline": "마감일",
    "schedule.milestone": "마일스톤",

    // Member role
    "role.admin": "관리자",
    "role.leader": "리더",
    "role.member": "팀원",

    // Dashboard
    "dashboard.title": "대시보드",
    "dashboard.total_tasks": "전체 업무",
    "dashboard.in_progress": "진행 중",
    "dashboard.completed_this_week": "이번 주 완료",
    "dashboard.overdue": "지연",
    "dashboard.upcoming_deadlines": "마감 예정",
    "dashboard.recent_activity": "최근 활동",
    "dashboard.workload": "팀원별 업무 현황",
    "dashboard.priority_dist": "우선순위 분포",

    // Tasks
    "task.title": "업무 관리",
    "task.new": "새 업무 만들기",
    "task.name": "업무명",
    "task.description": "설명",
    "task.priority": "우선순위",
    "task.due_date": "마감일",
    "task.assignees": "담당자",
    "task.tags": "태그",
    "task.brd": "BRD 연결",
    "task.status": "상태",
    "task.created_at": "생성일",
    "task.comments": "댓글",
    "task.comment_placeholder": "댓글을 입력하세요...",
    "task.title_placeholder": "업무 제목을 입력하세요",
    "task.desc_placeholder": "업무 설명 (마크다운 지원)",
    "task.kanban": "칸반",
    "task.list": "목록",

    // Calendar
    "calendar.title": "캘린더",
    "calendar.new_event": "새 일정 만들기",
    "calendar.event_title": "일정명",
    "calendar.event_type": "유형",
    "calendar.location": "장소",
    "calendar.start": "시작",
    "calendar.end": "종료",
    "calendar.month": "월",
    "calendar.week": "주",

    // Members
    "member.title": "팀원 관리",
    "member.name": "이름",
    "member.email": "이메일",
    "member.role": "역할",
    "member.lob": "LOB",
    "member.add": "팀원 추가",
    "member.edit": "팀원 정보 수정",
    "member.name_placeholder": "홍길동",
    "member.email_placeholder": "example@company.com",

    // LOB
    "lob.title": "LOB 관리",
    "lob.code": "코드",
    "lob.title_col": "타이틀(Local)",
    "lob.title_en_col": "타이틀(EN)",
    "lob.content": "내용",
    "lob.note": "비고",
    "lob.add": "LOB 추가",

    // SOW
    "sow.title": "SOW",
    "sow.id": "SOW ID",
    "sow.lob": "LOB",
    "sow.add": "SOW 추가",
    "sow.bulk_upload": "엑셀 업로드",

    // BRD
    "brd.title": "BRD",
    "brd.id": "BRD ID",
    "brd.sow": "SOW",
    "brd.add": "BRD 추가",
    "brd.bulk_upload": "엑셀 업로드",

    // Common Codes
    "codes.title": "공통코드",
    "codes.group": "그룹",
    "codes.code": "코드",
    "codes.add": "코드 추가",

    // Board (Glossary / Meeting Notes)
    "glossary.title": "용어정의",
    "glossary.term": "용어",
    "glossary.definition": "정의",
    "glossary.add": "용어 추가",
    "meeting_notes.title": "회의록",
    "meeting_notes.name": "회의명",
    "meeting_notes.content": "회의 내용",
    "meeting_notes.add": "회의록 추가",
    "board.ref_date": "참조일",
    "board.attachments": "첨부파일",
    "board.lob": "LOB",

    // Settings
    "settings.title": "설정",
    "settings.timezone": "타임존",
    "settings.language": "언어 설정",
    "settings.language_local": "한국어",
    "settings.language_en": "English",
    "settings.show_english": "영문 표시",

    // Auth
    "auth.login": "로그인",
    "auth.logout": "로그아웃",
    "auth.email": "이메일",
    "auth.password": "비밀번호",
    "auth.change_password": "비밀번호 변경",
    "auth.current_password": "현재 비밀번호",
    "auth.new_password": "새 비밀번호",
    "auth.confirm_password": "비밀번호 확인",

    // Common UI
    "common.loading": "로딩 중...",
    "common.error": "오류가 발생했습니다",
    "common.no_data": "데이터가 없습니다",
    "common.all": "전체",
    "common.none": "없음",
    "common.required_field": "필수 항목",
    "common.yes": "예",
    "common.no": "아니오",

    // Errors — API error code 대응
    "error.INVALID_ID": "잘못된 ID입니다",
    "error.TASK_NOT_FOUND": "업무를 찾을 수 없습니다",
    "error.MEMBER_NOT_FOUND": "팀원을 찾을 수 없습니다",
    "error.SOW_NOT_FOUND": "SOW를 찾을 수 없습니다",
    "error.LOB_NOT_FOUND": "LOB를 찾을 수 없습니다",
    "error.BRD_NOT_FOUND": "BRD를 찾을 수 없습니다",
    "error.CODE_NOT_FOUND": "공통코드를 찾을 수 없습니다",
    "error.POST_NOT_FOUND": "게시글을 찾을 수 없습니다",
    "error.ATTACHMENT_NOT_FOUND": "파일을 찾을 수 없습니다",
    "error.SCHEDULE_NOT_FOUND": "일정을 찾을 수 없습니다",
    "error.LOGIN_REQUIRED": "이메일과 비밀번호를 입력해주세요",
    "error.INVALID_CREDENTIALS": "이메일 또는 비밀번호가 올바르지 않습니다",
    "error.TITLE_REQUIRED": "제목은 필수입니다",
    "error.NAME_EMAIL_REQUIRED": "이름과 이메일은 필수입니다",
    "error.DUPLICATE_CODE": "이미 존재하는 코드입니다",
    "error.LAST_ADMIN": "마지막 관리자 계정은 삭제할 수 없습니다",
    "error.NO_FILE": "업로드할 파일이 없습니다",
    "error.FILE_TOO_LARGE": "파일이 너무 큽니다",
    "error.SERVER_ERROR": "서버 오류가 발생했습니다",
    "error.UNAUTHORIZED": "인증이 필요합니다",
    "error.FORBIDDEN": "접근 권한이 없습니다",
    "error.PASSWORD_MISMATCH": "비밀번호가 일치하지 않습니다",
    "error.WRONG_PASSWORD": "현재 비밀번호가 올바르지 않습니다",
  },

  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.calendar": "Calendar",
    "nav.members": "Members",
    "nav.lob": "LOB",
    "nav.sow": "SOW",
    "nav.brd": "BRD",
    "nav.codes": "Common Codes",
    "nav.glossary": "Glossary",
    "nav.meeting_notes": "Meeting Notes",
    "nav.settings": "Settings",

    // Actions
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.add": "Add",
    "action.create": "Create",
    "action.search": "Search",
    "action.filter": "Filter",
    "action.close": "Close",
    "action.confirm": "Confirm",
    "action.upload": "Upload",
    "action.download": "Download",
    "action.import": "Import",

    // Task status
    "status.todo": "To Do",
    "status.in_progress": "In Progress",
    "status.review": "Review",
    "status.done": "Done",
    "status.active": "Active",
    "status.inactive": "Inactive",

    // Priority
    "priority.urgent": "Urgent",
    "priority.high": "High",
    "priority.medium": "Medium",
    "priority.low": "Low",

    // Schedule type
    "schedule.meeting": "Meeting",
    "schedule.deadline": "Deadline",
    "schedule.milestone": "Milestone",

    // Member role
    "role.admin": "Admin",
    "role.leader": "Leader",
    "role.member": "Member",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.total_tasks": "Total Tasks",
    "dashboard.in_progress": "In Progress",
    "dashboard.completed_this_week": "Completed This Week",
    "dashboard.overdue": "Overdue",
    "dashboard.upcoming_deadlines": "Upcoming Deadlines",
    "dashboard.recent_activity": "Recent Activity",
    "dashboard.workload": "Workload by Member",
    "dashboard.priority_dist": "Priority Distribution",

    // Tasks
    "task.title": "Tasks",
    "task.new": "New Task",
    "task.name": "Title",
    "task.description": "Description",
    "task.priority": "Priority",
    "task.due_date": "Due Date",
    "task.assignees": "Assignees",
    "task.tags": "Tags",
    "task.brd": "BRD Link",
    "task.status": "Status",
    "task.created_at": "Created",
    "task.comments": "Comments",
    "task.comment_placeholder": "Add a comment...",
    "task.title_placeholder": "Task title",
    "task.desc_placeholder": "Task description (Markdown supported)",
    "task.kanban": "Kanban",
    "task.list": "List",

    // Calendar
    "calendar.title": "Calendar",
    "calendar.new_event": "New Event",
    "calendar.event_title": "Event Title",
    "calendar.event_type": "Type",
    "calendar.location": "Location",
    "calendar.start": "Start",
    "calendar.end": "End",
    "calendar.month": "Month",
    "calendar.week": "Week",

    // Members
    "member.title": "Members",
    "member.name": "Name",
    "member.email": "Email",
    "member.role": "Role",
    "member.lob": "LOB",
    "member.add": "Add Member",
    "member.edit": "Edit Member",
    "member.name_placeholder": "John Doe",
    "member.email_placeholder": "example@company.com",

    // LOB
    "lob.title": "LOB",
    "lob.code": "Code",
    "lob.title_col": "Title (Local)",
    "lob.title_en_col": "Title (EN)",
    "lob.content": "Content",
    "lob.note": "Note",
    "lob.add": "Add LOB",

    // SOW
    "sow.title": "SOW",
    "sow.id": "SOW ID",
    "sow.lob": "LOB",
    "sow.add": "Add SOW",
    "sow.bulk_upload": "Excel Upload",

    // BRD
    "brd.title": "BRD",
    "brd.id": "BRD ID",
    "brd.sow": "SOW",
    "brd.add": "Add BRD",
    "brd.bulk_upload": "Excel Upload",

    // Common Codes
    "codes.title": "Common Codes",
    "codes.group": "Group",
    "codes.code": "Code",
    "codes.add": "Add Code",

    // Board (Glossary / Meeting Notes)
    "glossary.title": "Glossary",
    "glossary.term": "Term",
    "glossary.definition": "Definition",
    "glossary.add": "Add Term",
    "meeting_notes.title": "Meeting Notes",
    "meeting_notes.name": "Meeting Name",
    "meeting_notes.content": "Meeting Content",
    "meeting_notes.add": "Add Notes",
    "board.ref_date": "Reference Date",
    "board.attachments": "Attachments",
    "board.lob": "LOB",

    // Settings
    "settings.title": "Settings",
    "settings.timezone": "Timezone",
    "settings.language": "Language",
    "settings.language_local": "한국어",
    "settings.language_en": "English",
    "settings.show_english": "Show English",

    // Auth
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.change_password": "Change Password",
    "auth.current_password": "Current Password",
    "auth.new_password": "New Password",
    "auth.confirm_password": "Confirm Password",

    // Common UI
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.no_data": "No data",
    "common.all": "All",
    "common.none": "None",
    "common.required_field": "Required",
    "common.yes": "Yes",
    "common.no": "No",

    // Errors — keyed by API error code
    "error.INVALID_ID": "Invalid ID",
    "error.TASK_NOT_FOUND": "Task not found",
    "error.MEMBER_NOT_FOUND": "Member not found",
    "error.SOW_NOT_FOUND": "SOW not found",
    "error.LOB_NOT_FOUND": "LOB not found",
    "error.BRD_NOT_FOUND": "BRD not found",
    "error.CODE_NOT_FOUND": "Common code not found",
    "error.POST_NOT_FOUND": "Post not found",
    "error.ATTACHMENT_NOT_FOUND": "File not found",
    "error.SCHEDULE_NOT_FOUND": "Schedule not found",
    "error.LOGIN_REQUIRED": "Email and password are required",
    "error.INVALID_CREDENTIALS": "Invalid email or password",
    "error.TITLE_REQUIRED": "Title is required",
    "error.NAME_EMAIL_REQUIRED": "Name and email are required",
    "error.DUPLICATE_CODE": "Code already exists",
    "error.LAST_ADMIN": "Cannot delete the last admin account",
    "error.NO_FILE": "No file to upload",
    "error.FILE_TOO_LARGE": "File is too large",
    "error.SERVER_ERROR": "Server error occurred",
    "error.UNAUTHORIZED": "Authentication required",
    "error.FORBIDDEN": "Access denied",
    "error.PASSWORD_MISMATCH": "Passwords do not match",
    "error.WRONG_PASSWORD": "Current password is incorrect",
  },
};

/**
 * 번역 키로 텍스트를 반환하는 React 훅. `language` 설정을 자동으로 읽는다.
 *
 * 사용:
 *   const t = useT();
 *   t("action.save")                   // "저장" or "Save"
 *   t("task.count", { n: 5 })          // "5개의 업무" or "5 tasks"
 *   t(`error.${code}`)                 // API 에러 코드 번역
 */
export function useT() {
  const { language } = useSettings();
  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const lang = language as Lang;
      const val = dict[lang]?.[key] ?? dict.local[key] ?? key;
      if (!vars) return val;
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        val,
      );
    },
    [language],
  );
}

/**
 * React 훅 외부에서 특정 언어로 직접 번역할 때 사용.
 * 컴포넌트 내부에서는 반드시 `useT()` 훅을 사용한다.
 */
export function translate(key: string, lang: Lang = "local"): string {
  return dict[lang]?.[key] ?? dict.local[key] ?? key;
}
