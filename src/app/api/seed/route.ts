import { getDb, saveDb } from "@/db";
import { withTransaction } from "@/db/helpers";
import { withApiHandler } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApiHandler(async (_req: NextRequest) => {
  const db = await getDb();

  // 기존 데이터가 있으면 스킵
  const existing = db.exec("SELECT COUNT(*) as cnt FROM members");
  if ((existing[0]?.values[0]?.[0] as number) > 0) {
    return NextResponse.json({ message: "이미 시드 데이터가 존재합니다" });
  }

  withTransaction(db, () => {
  // 팀원 5명
  db.run(`INSERT INTO members (name, email, role) VALUES ('김민수', 'minsu@team.com', 'admin')`);
  db.run(`INSERT INTO members (name, email, role) VALUES ('이지은', 'jieun@team.com', 'member')`);
  db.run(`INSERT INTO members (name, email, role) VALUES ('박서준', 'seojun@team.com', 'member')`);
  db.run(`INSERT INTO members (name, email, role) VALUES ('최유나', 'yuna@team.com', 'member')`);
  db.run(`INSERT INTO members (name, email, role) VALUES ('정도현', 'dohyun@team.com', 'member')`);

  // 태그
  db.run(`INSERT INTO tags (name, color) VALUES ('프론트엔드', '#3b82f6')`);
  db.run(`INSERT INTO tags (name, color) VALUES ('백엔드', '#10b981')`);
  db.run(`INSERT INTO tags (name, color) VALUES ('디자인', '#f59e0b')`);
  db.run(`INSERT INTO tags (name, color) VALUES ('버그', '#ef4444')`);
  db.run(`INSERT INTO tags (name, color) VALUES ('기능', '#8b5cf6')`);

  // 업무 12건 — 다양한 상태/우선순위
  const tasks = [
    { title: "API 리팩토링", desc: "REST API 구조 개선 및 에러 핸들링 통일", status: "in_progress", priority: "urgent", due: "2026-04-16", by: 1 },
    { title: "로그인 페이지 디자인", desc: "신규 브랜드 가이드에 맞춘 로그인/회원가입 UI", status: "review", priority: "high", due: "2026-04-17", by: 2 },
    { title: "데이터베이스 마이그레이션", desc: "PostgreSQL에서 신규 스키마로 마이그레이션 스크립트 작성", status: "todo", priority: "high", due: "2026-04-20", by: 3 },
    { title: "사용자 피드백 수집 폼", desc: "인앱 피드백 위젯 구현", status: "todo", priority: "medium", due: "2026-04-22", by: 4 },
    { title: "성능 모니터링 대시보드", desc: "Grafana 연동 및 핵심 메트릭 시각화", status: "in_progress", priority: "medium", due: "2026-04-18", by: 5 },
    { title: "이메일 알림 시스템", desc: "업무 배정/마감 임박 시 이메일 발송", status: "todo", priority: "low", due: "2026-04-25", by: 1 },
    { title: "모바일 반응형 적용", desc: "태블릿/모바일 뷰 최적화", status: "in_progress", priority: "high", due: "2026-04-15", by: 2 },
    { title: "테스트 코드 작성", desc: "핵심 API 라우트에 대한 유닛 테스트", status: "todo", priority: "medium", due: "2026-04-23", by: 3 },
    { title: "CI/CD 파이프라인 구축", desc: "GitHub Actions 기반 배포 자동화", status: "done", priority: "high", due: "2026-04-10", by: 4 },
    { title: "검색 기능 구현", desc: "업무 제목/설명 풀텍스트 검색", status: "done", priority: "medium", due: "2026-04-08", by: 5 },
    { title: "권한 시스템 설계", desc: "역할 기반 접근 제어(RBAC) 구현", status: "review", priority: "urgent", due: "2026-04-14", by: 1 },
    { title: "다크모드 지원", desc: "시스템 테마 감지 및 수동 전환 기능", status: "todo", priority: "low", due: "2026-04-28", by: 2 },
  ];

  tasks.forEach((t, i) => {
    const completedAt = t.status === "done" ? t.due : null;
    db.run(
      "INSERT INTO tasks (title, description, status, priority, due_date, completed_at, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))",
      [t.title, t.desc, t.status, t.priority, t.due, completedAt, t.by, `-${12 - i} days`, `-${Math.max(0, 5 - i)} days`]
    );
  });

  // 담당자 배정 — 각 업무에 1~2명
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (1, 1)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (1, 3)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (2, 2)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (3, 3)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (3, 5)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (4, 4)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (5, 5)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (5, 1)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (6, 1)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (7, 2)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (7, 4)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (8, 3)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (9, 4)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (10, 5)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (11, 1)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (11, 2)`);
  db.run(`INSERT INTO task_assignees (task_id, member_id) VALUES (12, 2)`);

  // 태그 연결
  db.run(`INSERT INTO task_tags VALUES (1, 2)`); // API 리팩토링 - 백엔드
  db.run(`INSERT INTO task_tags VALUES (2, 1)`); // 로그인 디자인 - 프론트엔드
  db.run(`INSERT INTO task_tags VALUES (2, 3)`); // 로그인 디자인 - 디자인
  db.run(`INSERT INTO task_tags VALUES (3, 2)`); // DB 마이그레이션 - 백엔드
  db.run(`INSERT INTO task_tags VALUES (5, 1)`); // 성능 대시보드 - 프론트엔드
  db.run(`INSERT INTO task_tags VALUES (7, 1)`); // 모바일 반응형 - 프론트엔드
  db.run(`INSERT INTO task_tags VALUES (9, 2)`); // CI/CD - 백엔드
  db.run(`INSERT INTO task_tags VALUES (11, 2)`); // 권한 시스템 - 백엔드
  db.run(`INSERT INTO task_tags VALUES (11, 5)`); // 권한 시스템 - 기능

  // 댓글
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (1, 3, '에러 코드 체계를 먼저 정리하면 좋겠습니다', datetime('now', '-2 days'))`);
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (1, 1, '동의합니다. HTTP 상태 코드 매핑 표 먼저 만들겠습니다', datetime('now', '-1 days'))`);
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (2, 4, '컬러 팔레트 시안 공유해주세요', datetime('now', '-3 days'))`);
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (7, 2, '768px 브레이크포인트 기준으로 작업 중입니다', datetime('now', '-1 days'))`);
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (11, 2, '관리자/멤버 2단계면 충분할까요?', datetime('now', '-4 hours'))`);
  db.run(`INSERT INTO comments (task_id, member_id, content, created_at) VALUES (11, 1, '우선 2단계로 가고, 추후 확장합시다', datetime('now', '-2 hours'))`);

  // 스케줄
  db.run(`INSERT INTO schedules (title, type, start_at, end_at, created_by, created_at) VALUES ('주간 스탠드업', 'meeting', '2026-04-15T09:00:00', '2026-04-15T09:30:00', 1, datetime('now'))`);
  db.run(`INSERT INTO schedules (title, type, start_at, end_at, location, created_by, created_at) VALUES ('스프린트 회고', 'meeting', '2026-04-18T14:00:00', '2026-04-18T15:00:00', '3층 회의실', 1, datetime('now'))`);
  db.run(`INSERT INTO schedules (title, type, start_at, task_id, created_by, created_at) VALUES ('마감: API 리팩토링', 'deadline', '2026-04-16', 1, 1, datetime('now'))`);
  db.run(`INSERT INTO schedules (title, type, start_at, task_id, created_by, created_at) VALUES ('마감: 로그인 페이지 디자인', 'deadline', '2026-04-17', 2, 2, datetime('now'))`);
  db.run(`INSERT INTO schedules (title, type, start_at, created_by, created_at) VALUES ('v2.0 릴리즈', 'milestone', '2026-04-30', 1, datetime('now'))`);

  // 활동 로그
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (1, 1, 'status_changed', '{"from":"todo","to":"in_progress"}', datetime('now', '-3 hours'))`);
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (2, 2, 'status_changed', '{"from":"in_progress","to":"review"}', datetime('now', '-2 hours'))`);
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (11, 1, 'commented', '{"preview":"우선 2단계로 가고..."}', datetime('now', '-2 hours'))`);
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (7, 2, 'assigned', '{"assignee":"최유나"}', datetime('now', '-1 hours'))`);
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (5, 5, 'status_changed', '{"from":"todo","to":"in_progress"}', datetime('now', '-30 minutes'))`);
  db.run(`INSERT INTO activity_logs (task_id, member_id, action, detail, created_at) VALUES (1, 3, 'commented', '{"preview":"에러 코드 체계를 먼저..."}', datetime('now', '-10 minutes'))`);
  });

  saveDb(db);
  return NextResponse.json({ message: "시드 데이터가 생성되었습니다", counts: { members: 5, tasks: 12, schedules: 5 } });
});
