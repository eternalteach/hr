# SearchableSelect

검색 기능이 내장된 셀렉트박스 컴포넌트.
옵션이 많을 때 키워드로 빠르게 필터링할 수 있습니다.

## 위치

```
src/components/ui/SearchableSelect.tsx
```

## Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `string` | ✅ | — | 현재 선택된 값 (`option.value`) |
| `onChange` | `(value: string) => void` | ✅ | — | 값 변경 콜백. 초기화 시 `""` 전달 |
| `options` | `SelectOption[]` | ✅ | — | 드롭다운에 표시할 옵션 목록 |
| `placeholder` | `string` | | `"선택하세요"` | 선택 전 버튼에 표시되는 안내 문구 |
| `searchPlaceholder` | `string` | | `"검색…"` | 검색창 placeholder |
| `disabled` | `boolean` | | `false` | 비활성화 여부 |
| `className` | `string` | | — | 루트 래퍼 추가 클래스 |

### SelectOption

```ts
interface SelectOption {
  value: string;   // 폼에 저장되는 실제 값
  label: string;   // 드롭다운에 표시되는 주 텍스트
  sub?: string;    // 레이블 아래 보조 텍스트 (선택)
}
```

## 검색 동작

- 검색창에 입력하면 `label`, `value`, `sub` 세 필드 모두에 대해 **대소문자 무관 부분 일치(LIKE)** 필터 적용
- 드롭다운이 열릴 때 자동으로 검색창에 포커스
- 컨테이너 외부 클릭 시 드롭다운 자동 닫힘
- `×` 버튼 클릭 시 선택값 초기화 (`onChange("")` 호출)

## 사용 예시

### 기본 사용

```tsx
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

const options: SelectOption[] = [
  { value: "SOW-2026-001", label: "클라우드 전환 프로젝트", sub: "SOW-2026-001" },
  { value: "SOW-2026-002", label: "보안 강화 SOW",         sub: "SOW-2026-002" },
];

<SearchableSelect
  value={form.sow_id}
  onChange={v => setForm(f => ({ ...f, sow_id: v }))}
  options={options}
  placeholder="SOW 선택"
  searchPlaceholder="SOW ID 또는 타이틀 검색"
/>
```

### API 데이터와 연동

```tsx
const [sows, setSows] = useState<Sow[]>([]);
useEffect(() => {
  fetch("/api/sow").then(r => r.json()).then(setSows);
}, []);

<SearchableSelect
  value={form.sow_id}
  onChange={v => {
    const sow = sows.find(s => s.sow_id === v);
    setForm(f => ({ ...f, sow_id: v, lob: sow?.lob ?? "" }));
  }}
  options={sows.map(s => ({
    value: s.sow_id,
    label: s.title_local || s.sow_id,
    sub: s.sow_id,
  }))}
  placeholder="SOW 선택"
  searchPlaceholder="SOW ID 또는 타이틀 검색"
/>
```

### 비활성화 (읽기 전용 표시)

```tsx
<SearchableSelect
  value={form.lob}
  onChange={() => {}}
  options={lobOptions}
  disabled
/>
```

## UX 흐름

```
버튼 클릭
  → 드롭다운 열림 + 검색창 자동 포커스
  → 검색어 입력 → label/value/sub LIKE 필터
  → 옵션 클릭 → onChange(value) 호출 + 드롭다운 닫힘
  → × 클릭 → onChange("") 호출 (초기화)
```

## 현재 사용 위치

| 파일 | 용도 |
|---|---|
| `src/components/brd/BrdFormModal.tsx` | SOW 선택 (선택 시 LOB 자동 세팅) |
| `src/components/tasks/task-create-modal.tsx` | BRD 선택 (선택 시 LOB 자동 표시) |
| `src/components/tasks/task-detail-modal.tsx` | BRD 선택 편집 (선택 시 LOB 자동 표시) |
