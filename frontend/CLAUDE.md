# Frontend CLAUDE.md

## 환경

- 환경 파일: `.env.development` / `.env.staging` / `.env.production` — **`env-cmd` 로 명시 로딩** (Next.js 기본 동작 아님). 모든 npm script 가 환경 명시 (예: `npm run dev` = `env-cmd -f .env.development next dev`)
- **의존성 핀**: `better-auth` `1.6.11` / `kysely`(+`@better-auth/kysely-adapter`) `0.28.17` **정확 고정** (캐럿 `^` 금지 — 1.6.12 가 kysely 0.29 를 끌어와 `DEFAULT_MIGRATION_TABLE` 제거 → adapter 깨짐). `uuid`(v7, `auth.ts` 의 `generateId`) 직접 의존성 필수. `prisma.config.ts` 는 env 검증 우회 위해 `process.env.DATABASE_URL ?? ""` 직접 사용.

## Container 구조 (모든 CRUD 페이지의 기본)

Splitter 로 좌측(목록) + 우측(상세) 분할.
```tsx
<Splitter>
  <MasterPanel title buttons>
    <MasterGrid dataSource columns onSelectionChanged />
  </MasterPanel>
  <DetailPanel data ViewComponent FormComponent apiService onComplete />
</Splitter>
```

**변형** (상세: [`design-patterns-frontend.md`](../.claude/docs/design-patterns-frontend.md) 의 "패턴 변형", anti-patterns 룰 5 예외):
- **2-depth 스코프**: `Splitter` 위 `ConditionBar` / `{Scope}ControlBar` 로 부모 스코프 선택 후 자식 CRUD (예: Document = Project 선택 → 문서 목록)
- **비-CRUD**: 대화형/워크스페이스 (채팅) 는 `Splitter` + 도메인 패널 — `MasterPanel`/`DetailPanel` 없음
- **추출 상세 섹션**: View/Form 이 공유하는 섹션 컴포넌트는 `editable` prop 으로 모드 전환 (View=false / Form 기본 true)

## 재사용 훅/컴포넌트 (새로 만들지 말 것)

**훅 (`hooks/shared/`)**
- `useMasterGridData({ fetchGrid, fetchData })` → `{ dataSource, selectedData, handleSelect, handleCreate, handleRefresh }` 반환
- `useMasterGridActions({ onCreate, onRefresh, onExcelDownload })` → 툴바 버튼
- `useDetailGridData` → 2-depth 디테일 그리드
- `useFormState` → 폼 입력 상태
- `useExcelExport`, `useTreeGridData`, `useFileList`, `useFileGroups`

**컴포넌트 (`components/shared/`)**
- `DataGrid/` → MasterGrid, DetailGrid, SelectGrid, DualSelectGrid
- `DataPanel/` → MasterPanel, DetailPanel, SelectGridPanel, TreeGridPanel
- `ui/` → TextBox, DateBox, DropdownBox, CheckBox 등 (DevExtreme 래퍼)
- `Layout/FormModal`, `Feedback/MessagePopup`

**스토어 (`stores/shared/`)**
- `codeStore` → `getCode("그룹코드")`로 공통코드 목록 반환. 가장 자주 사용됨
- `navStore`, `messageStore`, `uploadProgressStore`

## 핵심 유틸

- `utils/common/api/client.ts` → `apiCall()`: 모든 클라이언트 API 호출
- `utils/common/api/server.ts` → `proxyApiRequest(url, options, mode)`: API Route에서 Backend 프록시. `mode`: `stream`/`binary`/`passthrough`/`external`
- `utils/common/api/responses.ts` → `createSuccessResponse()`, `createErrorResponse()`
- `lib/devextreme/filters.ts` → `convertFilterToPrismaWhere()`, `convertSortToPrismaOrderBy()`
- `lib/zod/helpers.ts` → `str()`, `int()`, `float()`, `bool()`, `date()`, `StrRange()`, `IntRange()`, `Field()`, `Optional()`, `object()` 등 — Zod schema 작성 시 직접 `z.*` 대신 이 헬퍼 사용

## 에러 처리

Backend → 사용자 토스트 자동 흐름 — 페이지·feature 컴포넌트에서 `try/catch` 추가 불필요:

```
Backend exception_handler → {detail: "한글 메시지", status: 4xx/5xx}
  → API Route createErrorResponse (axios 에러는 패스스루)
  → apiCall axios throw
  → 공용 훅 (useMasterGridData / useDetailGridData / DetailPanel / FileUploader) catch
  → getApiErrorMessage(error) → showToast(msg, "error")
```

- `utils/common/api/responses.ts` → `createErrorResponse(error, operation)`: API Route 의 5 갈래 매핑 (AUTH / Prisma / Axios 패스스루 / `{message}` plain / fallback)
- `utils/common/errors/apierrors.ts` → `getApiErrorMessage(error)`: 우선순위 ① `detail` 문자열 (Backend 도메인 예외) ② `detail` 배열 (Prisma type 한글 번역 → 첫 `msg`) ③ `error`/`message` 필드 ④ STATUS_MESSAGES (400~504 17개) ⑤ "네트워크 연결을 확인해주세요"
- 입력 검증은 Zod 가 사전 차단 → Pydantic 422 도달 거의 없음 (STATUS_MESSAGES 422 는 안전망)

---

## Anti-patterns 체크리스트 (작업 중 즉시 회피)

상세 (❌/✅ 예시, grep, 예외) 는 [`.claude/docs/anti-patterns-frontend.md`](../.claude/docs/anti-patterns-frontend.md). 신규 CRUD 코드 패턴은 [`.claude/docs/design-patterns-frontend.md`](../.claude/docs/design-patterns-frontend.md).

> 룰 번호/이름은 [`anti-patterns-frontend.md`](../.claude/docs/anti-patterns-frontend.md) 의 `### N.` 헤더와 텍스트 정확히 일치.

**재사용 / 위치**
1. **재사용 훅/컴포넌트 무시하고 자체 구현** → `hooks/shared/` + `components/shared/` 먼저 (`useMasterGridData`/`useFormState`)
2. **컴포넌트 위치 위반** → `components/features/{Entity}/`(PascalCase) / `shared/` / `providers/` / `layouts/` 4 폴더만
3. **자식 컴포넌트 Props snake_case (camelCase 위반)** → Props 는 camelCase, DB/API payload key 만 snake_case

**UI / Container**
4. **DevExtreme 직접 import** → `components/shared/ui/` 또는 `DataGrid/` 래퍼 통과
5. **Container 구조 위반** → `Splitter` + `MasterPanel` + `DetailPanel`

**데이터 / API**
6. **fetch / axios 직접 사용** → 클라이언트 `apiCall` · API Route `proxyApiRequest`
7. **데이터 흐름 패턴 혼재** → 한 엔티티는 Prisma 직접 / Backend 프록시 중 하나만
8. **API Route 인증 누락** → 모든 route `withAuth` (면제는 `proxy.ts` `PUBLIC_RULES` 등록)
9. **codeStore 무시** → 공통코드는 항상 `useCodeStore().getCode('GROUP_CODE')`

**스키마 / DB**
10. **Zod 직접 호출 (helpers 우회)** → `@/lib/zod/helpers` 사용
11. **Prisma 마이그레이션 명령 사용** → push-only (`npm run dev:prisma:push`), `prisma migrate *` 금지

**컴포넌트 타입**
12. **Server / Client Component 혼동** → `useState`/`useEffect`/`useRef`/`useReducer`/`useMemo`/`useCallback` 사용 시 첫 줄 `'use client'`

**라우트 정합성**
13. **Frontend 라우트 경로가 backend prefix 와 불일치** → proxy `{SERVICE}_SERVICE_URL + "/{prefix}"` 의 prefix 가 backend `APIRouter(prefix=...)` 와 byte-identical. external `app/api/external/{service}/{prefix}/`·`BASE_URL`·admin page 일치 (backend SoT, 변경 시 lockstep)
