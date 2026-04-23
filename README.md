# TaskFlow — 팀 업무 관리 시스템

소규모 팀(1~5명)을 위한 업무 배정, 진행사항 트래킹, 스케줄 관리 도구입니다.  
LOB → SOW → BRD → Task 계층 구조로 업무를 체계적으로 관리합니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript 5) |
| Database | SQLite (sql.js v1.14.1 — 순수 JS, 별도 서버 불필요) |
| UI | Tailwind CSS v4 + 커스텀 컴포넌트 |
| 칸반 DnD | @hello-pangea/dnd |
| 차트 | Recharts |
| 날짜 | date-fns v4 |
| 마크다운 | react-markdown + remark-gfm |
| 엑셀 | xlsx (클라이언트 파싱) |
| 폰트 | Pretendard (CDN) |
| 테스트 | Vitest v4 |

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속합니다.  
최초 접속 시 초기 설정 마법사(`/setup`)에서 관리자 계정을 생성합니다.

비밀번호 재설정이 필요한 경우:
```bash
node scripts/reset-password.js
```

## 주요 기능

### 대시보드 (/)
- 요약 카드: 전체 업무 / 진행 중 / 이번 주 완료 / 지연
- 팀원별 업무 현황 (수평 스택 바 차트)
- 우선순위 분포 (도넛 차트)
- 이번 주 마감 예정 리스트
- 최근 활동 로그 타임라인

### 업무 관리 (/tasks)
- 칸반 보드: 4단계 드래그&드롭 (할 일 → 진행 중 → 리뷰 → 완료)
- 리스트 뷰: 테이블 형태
- 필터: LOB / SOW / BRD / 우선순위 / 담당자 / 제목 검색
- 업무 생성: 제목, 설명, 우선순위, 마감일, 담당자(복수), 태그, BRD 연결
- 업무 상세: 상태/우선순위 변경, 댓글 스레드
- 낙관적 업데이트: DnD 시 UI 즉시 반영

### 캘린더 (/calendar)
- 월간 뷰: 날짜별 일정, 색상 구분 (회의/마감일/마일스톤)
- 주간 뷰: 시간축 타임라인
- 업무 마감일 자동 연동
- 일정 생성: 회의(장소 포함), 마감일, 마일스톤

### LOB 관리 (/lob)
- 공통코드 기반 LOB(Line of Business) 등록·수정
- 한국어·영문 양방향 타이틀/내용/비고 입력
- 활성/비활성 상태 관리

### SOW 관리 (/sow)
- LOB에 속한 SOW(Scope of Work) CRUD
- 엑셀 일괄 업로드 (드래그&드롭 → 미리보기 → 저장)
- 한국어·영문 양방향 입력

### BRD 관리 (/brd)
- SOW에 속한 BRD(Business Requirements Document) CRUD
- LOB → SOW → BRD 계층 연결
- 엑셀 일괄 업로드 지원

### 공통코드 (/codes)
- 그룹별 코드 마스터 관리 (예: LOB 그룹)
- 한국어·영문 양방향 입력

### 용어정의 (/glossary) · 회의록 (/meeting-notes)
- 통합 게시판(board_posts 테이블) 기반, board_type 컬럼으로 구분
- LOB 태깅, 참조 일자, 첨부파일 지원
- 마크다운 본문 렌더링

### 팀원 관리 (/members)
- 팀원 목록 카드 뷰
- 역할: admin / leader / member
- 팀원 추가 / 정보 수정

### 설정 (/settings)
- 타임존 설정
- 영문 표시 ON/OFF (사이드바 토글과 동기화)

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── page.tsx                # 대시보드
│   ├── tasks/page.tsx          # 업무 관리 (칸반+리스트)
│   ├── calendar/page.tsx       # 캘린더
│   ├── lob/page.tsx            # LOB 관리
│   ├── sow/page.tsx            # SOW 관리
│   ├── brd/page.tsx            # BRD 관리
│   ├── codes/page.tsx          # 공통코드
│   ├── glossary/page.tsx       # 용어정의 게시판
│   ├── meeting-notes/page.tsx  # 회의록 게시판
│   ├── members/page.tsx        # 팀원 관리
│   ├── settings/page.tsx       # 시스템 설정
│   ├── login/page.tsx          # 로그인
│   ├── setup/page.tsx          # 초기 설정 마법사
│   └── api/                    # REST API 라우트 (36+)
├── components/
│   ├── layout/                 # 사이드바 네비게이션
│   ├── tasks/                  # 칸반, 카드, 리스트, 모달
│   ├── dashboard/              # 차트, 요약 카드, 피드
│   ├── calendar/               # 월간/주간 뷰
│   ├── lob/ sow/ brd/          # 각 도메인 테이블·모달
│   ├── codes/                  # 공통코드 테이블·모달
│   ├── board/                  # 통합 게시판 UI
│   ├── excel/                  # 엑셀 업로드 존
│   ├── attachments/            # 첨부파일 목록
│   └── ui/                     # SearchableSelect 등 공통 UI
├── db/
│   ├── index.ts                # SQLite 스키마, 마이그레이션, saveDb()
│   └── helpers.ts              # queryAll / queryOne / insertAndGetId
└── lib/
    ├── types.ts                # 전체 TypeScript 타입
    ├── api-handler.ts          # withApiHandler + ApiError
    ├── auth-context.tsx        # 세션 기반 인증 컨텍스트
    ├── language-context.tsx    # 영문 표시 토글 컨텍스트
    └── settings-context.tsx    # 타임존/언어 설정 컨텍스트
```

## DB 스키마

| 테이블 | 용도 |
|---|---|
| members | 팀원 정보 + 역할 + 인증 (비밀번호 해시) |
| tasks | 업무 (상태, 우선순위, 마감일, soft delete) |
| task_assignees | 업무-담당자 다대다 |
| tags / task_tags | 태그 시스템 |
| comments | 업무별 댓글 |
| schedules | 일정 (회의/마감일/마일스톤) |
| sow | Scope of Work |
| brd | Business Requirements Document |
| common_codes | 공통코드 마스터 (LOB 포함) |
| board_posts | 통합 게시판 (용어정의/회의록) |
| attachments | 첨부파일 메타데이터 |
| activity_logs | 모든 변경 이력 |

## 다국어 지원

모든 마스터 데이터(LOB, SOW, BRD, 공통코드, 게시판)는  
`_local`(한국어) + `_en`(영문) 두 컬럼을 가집니다.  
사이드바의 "영문 표시" 토글로 영문 컬럼을 추가 노출할 수 있습니다.

## npm 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 (SQL 인젝션 패턴 포함) |
| `npm test` | 테스트 감시 모드 |
| `npm run test:run` | 단회 테스트 실행 |
| `npm run verify` | lint + tsc + test 통합 검사 |

## 라이선스

MIT
