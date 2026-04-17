# TaskFlow — 팀 업무 관리 시스템

소규모 팀(1~5명)을 위한 업무 배정, 진행사항 트래킹, 스케줄 관리 도구입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: SQLite (sql.js — 순수 JS, 별도 서버 불필요)
- **UI**: Tailwind CSS v4 + 커스텀 컴포넌트
- **칸반 DnD**: @hello-pangea/dnd
- **차트**: Recharts
- **날짜**: date-fns
- **폰트**: Pretendard (CDN)

## 빠른 시작

```bash
# 1. 압축 해제
tar -xzf team-task-manager.tar.gz
cd team-task-manager

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속하면 됩니다.
최초 접속 시 시드 데이터(팀원 5명, 업무 12건, 일정 5건)가 자동 생성됩니다.

## 주요 기능

### 대시보드 (/)
- 요약 카드: 전체 업무, 진행 중, 이번 주 완료, 지연
- 팀원별 업무 현황 (수평 스택 바 차트)
- 우선순위 분포 (도넛 차트)
- 이번 주 마감 예정 리스트
- 최근 활동 로그 타임라인

### 업무 관리 (/tasks)
- 칸반 보드: 4단계 드래그&드롭 (할 일 → 진행 중 → 리뷰 → 완료)
- 리스트 뷰: 테이블 형태
- 필터: 우선순위별, 담당자별
- 업무 생성: 제목, 설명, 우선순위, 마감일, 담당자(복수), 태그
- 업무 상세: 상태/우선순위 변경, 댓글 스레드
- 낙관적 업데이트: DnD 시 UI 즉시 반영

### 캘린더 (/calendar)
- 월간 뷰: 날짜별 일정, 색상 구분 (회의/마감일/마일스톤)
- 주간 뷰: 시간축 타임라인
- 업무 마감일 자동 연동
- 일정 생성: 회의(장소), 마감일, 마일스톤

### 팀원 관리 (/members)
- 팀원 목록 카드 뷰
- 팀원 추가 (이름, 이메일, 역할)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx            # 대시보드
│   ├── tasks/page.tsx      # 업무 관리
│   ├── calendar/page.tsx   # 캘린더
│   ├── members/page.tsx    # 팀원 관리
│   └── api/                # API 라우트 (13개)
├── components/
│   ├── layout/sidebar.tsx  # 사이드바
│   ├── tasks/              # 칸반, 카드, 리스트, 모달
│   ├── dashboard/          # 차트, 카드, 피드
│   └── shared/badges.tsx   # 공통 뱃지
├── db/index.ts             # SQLite 연결 + 스키마
└── lib/                    # 유틸, 타입, 상수
```

## DB 스키마

| 테이블 | 용도 |
|---|---|
| members | 팀원 정보 + 역할 |
| tasks | 업무 (상태, 우선순위, 마감일, soft delete) |
| task_assignees | 업무-담당자 다대다 |
| tags / task_tags | 태그 시스템 |
| comments | 업무별 댓글 |
| schedules | 일정 (회의/마감일/마일스톤) |
| activity_logs | 모든 변경 이력 |

## 커스터마이징

- 시드 데이터 수정: src/app/api/seed/route.ts
- DB 초기화: db/tasks.db 삭제 후 재시작
- 스타일: Tailwind CSS 클래스 직접 수정

## 라이선스

MIT
