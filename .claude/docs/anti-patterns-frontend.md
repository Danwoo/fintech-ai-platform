# Frontend Anti-Patterns

작업 중 위반 회피, review 시 위반 검출의 **단일 진실의 원천 (SoT)**.

## 이 파일의 역할

- **평상시 작업 (Claude 메인)**: 작업 중 패턴 위반 회피용. [`frontend/CLAUDE.md`](../../frontend/CLAUDE.md) 체크리스트에서 룰 번호로 점프해 상세 확인.
- **review-frontend 에이전트**: 모든 룰을 1번부터 순차 실행. 각 룰의 `**Detection**` 박스 명령 그대로 실행 → 후보 Read → `**예외**` 인용 후 분류 (위반/의심/통과).
- **scaffold-frontend 에이전트**: 코드 생성 시 이 docs + [`design-patterns-frontend.md`](design-patterns-frontend.md) 따르면 자동 회피.

## 각 룰의 4섹션 구조 (모두 통일)

1. **예시** — ❌ 위반 / ✅ 올바른 패턴 (코드 블록)
2. **룰** — 한 줄 statement (굵게 시작)
3. **Detection** — review-frontend 가 실행하는 grep 명령 + 0 hit / 1+ hit 후처리 안내. 룰 7 (데이터 흐름 혼재) 만 grep 대신 디렉토리 교집합 (`comm -12`) — 별도 절차 표기.
4. **예외** — Phase B 판정 시 반드시 인용. 단일 예외는 한 줄, 다중은 bullet list, 예외 없으면 `**예외**: 없음 (이유)`

## 헤더 일치 규칙

`### N. {룰명}` 헤더의 **번호와 텍스트는 review-frontend.md 출력 표 + frontend/CLAUDE.md 체크리스트와 정확히 동일**. 룰 추가/삭제 시 3곳 동시 갱신 필수.

## 목차

**재사용 / 위치**
- [1. 재사용 훅/컴포넌트 무시하고 자체 구현](#1-재사용-훅컴포넌트-무시하고-자체-구현)
- [2. 컴포넌트 위치 위반](#2-컴포넌트-위치-위반)
- [3. 자식 컴포넌트 Props snake_case (camelCase 위반)](#3-자식-컴포넌트-props-snake_case-camelcase-위반)

**UI / Container**
- [4. DevExtreme 직접 import](#4-devextreme-직접-import)
- [5. Container 구조 위반](#5-container-구조-위반)

**데이터 / API**
- [6. fetch / axios 직접 사용](#6-fetch--axios-직접-사용)
- [7. 데이터 흐름 패턴 혼재](#7-데이터-흐름-패턴-혼재)
- [8. API Route 인증 누락](#8-api-route-인증-누락)
- [9. codeStore 무시](#9-codestore-무시)

**스키마 / DB**
- [10. Zod 직접 호출 (helpers 우회)](#10-zod-직접-호출-helpers-우회)
- [11. Prisma 마이그레이션 명령 사용](#11-prisma-마이그레이션-명령-사용)

**컴포넌트 타입**
- [12. Server / Client Component 혼동](#12-server--client-component-혼동)

**라우트 정합성**
- [13. Frontend 라우트 경로가 backend prefix 와 불일치](#13-frontend-라우트-경로가-backend-prefix-와-불일치)

---

## 재사용 / 위치

### 1. 재사용 훅/컴포넌트 무시하고 자체 구현

```tsx
// ❌
const [data, setData] = useState([]);
const [selected, setSelected] = useState(null);
useEffect(() => { fetch('/api/...').then(...); }, []);

// ✅
const { dataSource, selectedData, handleSelect, handleCreate, handleRefresh }
  = useMasterGridData({ fetchGrid, fetchData });
```

**룰**: `hooks/shared/` 의 훅을 먼저 확인. 없으면 만들 것이 아니라 기존 동등 기능 컴포넌트와 비교 후 판단.

**Detection** (negative-pattern 📍):
```bash
git ls-files --cached --others --exclude-standard 'frontend/components/features/**/*Container.tsx'
```
hit = Container 후보. 각 파일 Read 후 `useState` + `useEffect` + `fetch` 패턴이 있고 `useMasterGridData` / `useFormState` 미사용 시 위반.

**우선순위 규칙**: hook 사용 + `'use client'` 누락 케이스가 룰 12 (Server/Client 혼동) 의 시그니처와 동시 매칭 시, **항상 룰 12 메인으로 분류** (룰 12 가 더 명백한 결함).

**예외**: 없음 (`hooks/shared/` 우회는 모두 위반 — 단, 진짜 동등 기능이 shared 에 없으면 통과).

### 2. 컴포넌트 위치 위반

```
❌ components/customer/CustomerList.tsx
❌ app/(main)/admin/customer/_components/CustomerForm.tsx

✅ components/features/Customer/CustomerContainer.tsx
✅ components/features/Customer/CustomerDetailView.tsx
✅ components/features/Customer/CustomerDetailForm.tsx
```

**룰**: `components/features/{Entity}/` (PascalCase 엔티티 폴더), `components/shared/`, `components/providers/`, `components/layouts/` 외 위치 금지. `app/.../_components/` 도 금지.

**Detection**:
```bash
git ls-files --cached --others --exclude-standard 'frontend/components/**/*.tsx' \
  | grep -vE '^frontend/components/(features|shared|providers|layouts)/'
git ls-files --cached --others --exclude-standard 'frontend/app/**/_components/**/*.tsx'
```
0 hit → 통과. 1+ hit → 위반.

**예외**: 없음 (위 4개 폴더 외 위치는 모두 위반).

### 3. 자식 컴포넌트 Props snake_case (camelCase 위반)

```tsx
// ❌ Props 가 DB 컬럼명 그대로
interface Props {
  data_id: number;
  experiment_id: string;
}
<Child data_id={data.data_id} experiment_id={data.experiment_id} />

// ✅ Props 는 camelCase, 호출처에서 변환
interface Props {
  dataId: number;
  experimentId: string;
}
<Child dataId={data.data_id} experimentId={data.experiment_id} />
```

**룰**: design-patterns 네이밍 표 (`{parentPk}` camelCase 변환) 에 따라 **Props 는 camelCase**, **DB/API payload key 는 snake_case** 로 도메인 분리. Backend payload (`selectFoo({ data_id: dataId })`) 의 LEFT 키는 DB 컬럼명 그대로 두고, RIGHT 만 camelCase prop 값으로.

**Detection**:
```bash
git grep --untracked -nE '(interface|type)\s+\w*Props\b' -- 'frontend/components/features/**/*.tsx'
```
0 hit → 통과. 1+ hit → 각 파일 Read 후 Props 정의 필드에 `snake_case` 식별자 존재 시 위반.

**예외**: 없음 (Props 는 camelCase 강제).

---

## UI / Container

### 4. DevExtreme 직접 import

```tsx
// ❌
import { TextBox, DataGrid } from 'devextreme-react';
<TextBox ... />

// ✅
import { TextBox } from '@/components/shared/ui';
import { MasterGrid } from '@/components/shared/DataGrid';
```

**룰**: Admin CRUD (객체 state 폼) 컨텍스트에선 `components/shared/ui/` 또는 `components/shared/DataGrid/` 래퍼 통과. wrapper 는 `fieldName` + `onValueChanged(fieldName, value)` 시그니처 강제 — `useFormState` 훅 짝의 객체 state 폼용.

**Detection**:
```bash
git grep --untracked -nE "from ['\"]devextreme-react" -- 'frontend/**/*.ts' 'frontend/**/*.tsx'
```
0 hit → 통과. 1+ hit → 후보별 Read 후 아래 5개 예외 검사.

**예외**: 룰 적용 X — wrapper 가 커버하지 못하는 케이스 ↓

1. **Auth/Mypage 등 native form 패턴** — `features/Common/Auth/*`, `features/Common/Mypage/*` 같이 HTMLFormElement 제출 (`e.target.email.value`) + DevExtreme `buttons` prop (TextBox 안 inline Button) 을 쓰는 폼. wrapper 가 `name`/`buttons`/uncontrolled 미지원이라 적용 불가.
2. **shared 에 wrapper 없는 컴포넌트** — `ScrollView` (Privacy/Terms), `Splitter` (모든 Container 가 직접 import) 등 wrapper 가 안 만들어진 DevExtreme 컴포넌트. wrapper 추가 전까지는 직접 import OK.
3. **Type-only import** — `import { type TextBoxTypes } from 'devextreme-react/text-box'`, `import { DataGridTypes } from 'devextreme-react/data-grid'` 같이 타입만 가져오는 경우. 런타임 영향 없음.
4. **시스템 관리 영역** — `features/Common/System/*` 전체. 이 영역에선 DevExtreme 직접 import OK.
5. **Standalone 컨텍스트** — `useFormState` 객체 폼이 아니고 **단일 값 바인딩** (`value={x}` + `onValueChanged={(e) => setX(e.value)}` — `fieldName`/`getFieldProps`/객체 콜백 `onValueChanged(fieldName, value)` 시그니처가 **아님**) 인 경우. state 출처가 `useState` 든 도메인 훅 (`hook.setX`) 이든 무관. wrapper 의 form 전용 시그니처가 무의미해 부적합. 예: 필터/검색/단일 select/모니터링 화면, 도메인 전용 섹션의 설정 컨트롤 (`<DevSelectBox value={chunksHook.chunkStrategy} onValueChanged={(e) => chunksHook.setChunkStrategy(e.value)} />` — 청크 분할 설정 등). wrapper 는 form 전용으로 보존.

### 5. Container 구조 위반

```tsx
// ❌ Splitter 안 쓰고 자체 레이아웃
<div className="flex">
  <div>...</div>
  <div>...</div>
</div>

// ✅
<Splitter>
  <MasterPanel ...><MasterGrid ... /></MasterPanel>
  <DetailPanel ... />
</Splitter>
```

**룰**: 모든 CRUD 어드민 페이지는 `Splitter` + `MasterPanel` + `DetailPanel` 구조.

**Detection** (negative-pattern 📍):
```bash
git ls-files --cached --others --exclude-standard 'frontend/components/features/**/*Container.tsx'
```
hit = Container 파일. 각 파일 Read 후 `Splitter` + `MasterPanel` + `DetailPanel` 구조 누락 시 위반.

**예외**:
- **단일 Master 패턴**: read-only 목록/뷰어 (로그/이력/모니터링 등 상세 편집 불필요한 화면) 는 `Splitter` 없이 `MasterPanel` + `MasterGrid` 단독으로 OK. 예: `EmailLogContainer`. CRUD detail 폼이 없는 화면은 의심으로도 보고하지 않음.
- **2-depth 스코프 선택 패턴**: Container 가 `Splitter` **위**에 `ConditionBar` / `{Scope}ControlBar` (예: `ProjectControlBar`) 를 두어 부모 스코프 (프로젝트 등) 를 먼저 고른 뒤 그 스코프의 자식을 `MasterGrid` 로 나열하는 구조. Splitter + MasterPanel + DetailPanel 은 **그대로 유지**되므로 위반 아님. grid/DetailPanel 이 `{selectedScopeId ? <...> : <placeholder>}` 로 가드되는 것도 정상. 예: `DocumentContainer`. (상세: [`design-patterns-frontend.md`](design-patterns-frontend.md) 의 "2-depth 스코프 선택")
- **비-CRUD 도메인 컨테이너**: 엔티티 CRUD 가 아닌 대화형/워크스페이스 화면 (예: 채팅) 은 `Splitter` + 도메인 전용 패널 (세션/대화 패널 등) 로 구성되고 `MasterPanel` / `DetailPanel` / `useFormState` / `apiService` 가 **없을 수 있음**. 이때 "DetailPanel 누락" 을 위반으로 보지 않는다. **식별 기준**: `DetailPanel`·`apiService`·`useFormState` 부재 **+** 대화/스트리밍/세션 훅 (`useChat*` 등) 또는 도메인 전용 패널 사용. 다른 룰 (Props camelCase, codeStore, fetch 직접 사용 등) 은 정상 적용. 예: `ChatContainer`. (상세: [`design-patterns-frontend.md`](design-patterns-frontend.md) 의 "비-CRUD 도메인 feature")

---

## 데이터 / API

### 6. fetch / axios 직접 사용

```ts
// ❌
const res = await fetch('/api/users', { ... });
const res = await axios.get('/api/users');

// ✅ 클라이언트
const res = await apiCall('/api/users', { method: 'GET' });

// ✅ API Route 에서 Backend 프록시
const res = await proxyApiRequest('/users', { method: 'GET', headers: { Authorization: `Bearer ${session.accessToken}` } });
```

**룰**: 모든 HTTP 호출은 `apiCall` (클라이언트) / `proxyApiRequest` (API Route) 사용. 직접 `fetch` / `axios` 금지.

**비-JSON / 외부 URL 처리**: `proxyApiRequest(url, options, mode)` 의 3번째 인자로 처리:
- `"stream"` — SSE 스트리밍
- `"binary"` — 바이너리 forward + content-type 보존
- `"passthrough"` — 요청 body 패스스루 (대용량 multipart upload)
- `"external"` — 외부 임의 URL fetch (사용자 입력 URL 검증/메타 추출). raw `Response` 반환

**Detection**:
```bash
git grep --untracked -nE '\b(fetch\(|axios\.(get|post|put|delete|patch)\()' \
  -- 'frontend/**/*.ts' 'frontend/**/*.tsx' \
  | grep -vE 'frontend/utils/common/api/(client|server|responses|sse)\.ts'
```
0 hit → 통과. 1+ hit → 위반 (헬퍼 본체는 grep 에서 자연 제외됨).

**예외**:
- **`utils/common/api/{client,server,responses,sse}.ts`**: `apiCall` / `proxyApiRequest` / `createSuccessResponse` / SSE 클라이언트 헬퍼 등의 본체 구현체. 이 파일들 안에서의 axios/fetch 직접 사용은 정상.
- **텔레메트리/로깅 인프라 (`lib/logger/*`)**: 부트스트랩 시점 `console` hook / `process` event listener 에서 외부 collector 로 fire-and-forget push. `apiCall` 은 클라이언트 전용이고 `proxyApiRequest` 는 API Route handler 헬퍼라 컨텍스트 불일치. 외부 telemetry SDK (OpenTelemetry, Sentry 등) 통합 시에도 동일.

### 7. 데이터 흐름 패턴 혼재

한 엔티티가 Prisma 직접 + Backend 프록시 섞으면 안 됨:

```
❌ Customer:
   - GET /api/common/customer (Prisma 직접)
   - POST /api/external/customer (Backend 프록시)

✅ Customer 는 한 패턴 통일:
   - GET/POST/PUT/DELETE /api/common/customer (전부 Prisma 직접)
```

**룰**: 같은 엔티티는 Prisma 직접 또는 Backend 프록시 중 하나로 통일.

**Detection** (디렉토리 교집합 비교, 별도 절차):
```bash
comm -12 \
  <(ls frontend/app/api/common/ 2>/dev/null | sort) \
  <(ls frontend/app/api/external/ 2>/dev/null | sort)
```
0 line → 통과. 1+ line = 같은 entity 가 양쪽 디렉토리 동시 존재 → 위반.

**예외**:
- **`full-stack-template` 의 `code-group`** 같이 템플릿이 두 패턴을 동시 시연하기 위한 의도된 중복은 위반 아님 (`api/common/system/code-group/` + `api/external/code-group/`). 파생 서비스에서는 한 쪽만 남기고 통일.

### 8. API Route 인증 누락

```ts
// ❌
export async function GET(request: NextRequest) {
  return Response.json(...);
}

// ✅
export const GET = withAuth(async (request, session) => {
  // session.accessToken 으로 백엔드 인증 가능
  return Response.json(...);
});
```

**룰**: 모든 API route 는 기본적으로 `withAuth` 거침.

**Detection** (negative-pattern 📍):
```bash
git ls-files --cached --others --exclude-standard 'frontend/app/api/**/route.ts'
```
hit = 모든 API route. 각 파일 Read 후 `withAuth(...)` wrapper 사용 여부 + `frontend/proxy.ts` 의 `PUBLIC_RULES` 등록 여부 확인:
```bash
grep -A 30 'PUBLIC_RULES' frontend/proxy.ts
```
둘 다 없으면 위반.

**예외**:
- **`frontend/proxy.ts` 의 `PUBLIC_RULES` 에 등록된 경로**: 미들웨어가 인증 검사를 면제하므로 route 핸들러에 `withAuth` 없어도 위반 아님. 회원가입/이메일 OTP/Better Auth 핸들러 등이 여기 해당. 새 public route 추가 시 반드시 `proxy.ts` 의 `PUBLIC_RULES` 에 등록 (path + method 명시).

```ts
// proxy.ts 의 PUBLIC_RULES 예
const PUBLIC_RULES: readonly PathRule[] = [
  { path: "/api/common/email", methods: ["POST"] },
  { path: "/api/common/signup", methods: ["GET", "POST"] },
  { path: "/api/auth/sign-in/", prefix: true },
  // ...
];
```

### 9. codeStore 무시

```tsx
// ❌
useEffect(() => {
  fetch('/api/codes?group=USE_YN').then(setCodes);
}, []);

// ✅
const { getCode } = useCodeStore();
const useYnCodes = getCode('USE_YN');
```

**룰**: 공통코드는 항상 `useCodeStore` + `getCode('GROUP_CODE')`.

**Detection**:
```bash
git grep --untracked -nE "(fetch|apiCall)\([^)]*['\"]\/api/(codes|common/code)" \
  -- 'frontend/**/*.ts' 'frontend/**/*.tsx'
```
0 hit → 통과. 1+ hit → 위반 (`fetch` / `apiCall` 둘 다 codeStore 우회로 간주).

**예외**: 없음 (공통코드는 항상 codeStore 경유).

---

## 스키마 / DB

### 10. Zod 직접 호출 (helpers 우회)

```ts
// ❌
import { z } from "zod";
const Schema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(120),
});

// ✅
import { object, StrRange, IntRange } from "@/lib/zod/helpers";
const Schema = object({
  name: StrRange(1, 100),
  age: IntRange(0, 120),
});
```

**룰**: `@/lib/zod/helpers` 의 `str`/`int`/`float`/`bool`/`date`/`email`/`phone`/`url`/`uuid`/`enums`/`StrRange`/`IntRange`/`FloatRange`/`PositiveInt`/`PositiveFloat`/`Numeric`/`Field`/`Optional`/`Required`/`object`/`array`/`record`/`password` 사용. 직접 `z.*` 호출 금지.

**Detection**:
```bash
git grep --untracked -nE '\bz\.(string|number|object|array|enum|literal|date|boolean|union)\(' \
  -- 'frontend/schemas/**/*.ts' 'frontend/components/**/*.tsx'
```
0 hit → 통과. 1+ hit → 후보별 Read 후 아래 2개 예외 검사.

**예외**:

1. **사용자-facing native form 폼** (`schemas/common/signup.ts`, `schemas/common/auth*.ts`, `schemas/common/mypage*.ts` + `features/Common/Auth/*`, `features/Common/Mypage/*` 의 인라인 schema) — 회원가입/로그인/마이페이지 같이 한국어 커스텀 에러 메시지가 UX 상 중요. helpers 가 메시지 인자를 지원 안 해서 `z.string().min(8, "비밀번호 8자리...")` 같이 직접 호출 OK.
2. **시스템 관리 영역** (`schemas/common/{adminUser,author,code,emailLog,menu}.ts` + `features/Common/System/*` 의 인라인 schema) — 이 영역에선 `z.*` 직접 호출 OK.

### 11. Prisma 마이그레이션 명령 사용

```bash
# ❌ — migrate 계열 명령 (dev/deploy/reset/resolve/status 등 모두 push-only 정책 위반)
npx prisma migrate dev
npx prisma migrate deploy

# ✅ — push 방식 (마이그레이션 파일 없음)
npm run dev:prisma:push
```

**룰**: 본 프로젝트는 schema **push 방식** 정책 (마이그레이션 없음). `prisma migrate` 하위 명령은 모두 금지.

**Detection**:
```bash
git grep --untracked -nE 'prisma\s+migrate\b' \
  -- 'frontend/package.json' 'frontend/scripts/**' '*.md' 'frontend/**/*.ts'
```
0 hit → 통과. 1+ hit → 위반.

**예외**: `migrate` 명령은 예외 없음. 단 **DB push 불가 환경**(schema.prisma 에 없는 레거시 테이블이 live DB 에 존재 → push 가 그것을 DROP)에선 1회성 변경을 `frontend/prisma/init/*.sql` 의 **additive-only DDL**(ALTER ADD / CREATE / INDEX / FK — DROP 금지, `BEGIN TRAN`+`CATCH ROLLBACK` 래핑) + 데이터 이관 SQL 로 직접 적용. SQL 은 `prisma migrate diff --from-schema <old> --to-schema <new> --script` (prisma 7 은 `--from-schema-datamodel` 폐지, `env-cmd -f .env.development` 필요) 로 생성.

---

## 컴포넌트 타입

### 12. Server / Client Component 혼동

```tsx
// ❌ "use client" 없이 useState/useEffect 사용
export default function Page() {
  const [data, setData] = useState();   // 에러
}

// ✅ 명시적 분리
'use client';
export default function ClientComp() { ... }

// 서버 컴포넌트
export default async function Page() {
  const data = await fetchOnServer();
  return <ClientComp initialData={data} />;
}
```

**룰**: `useState` / `useEffect` / `useRef` / `useReducer` / `useMemo` / `useCallback` 사용 컴포넌트는 첫 줄에 `'use client'` 필수. features/* 컴포넌트는 보통 `'use client'` 필요.

**Detection**:
```bash
git grep --untracked -lE '\b(useState|useEffect|useRef|useReducer|useMemo|useCallback)\(' \
  -- 'frontend/**/*.tsx'
```
hit = React hook 사용 파일. 각 파일 Read 후 첫 줄에 `'use client'` 또는 `"use client"` 없으면 위반.

**예외**: 없음 (hook 사용 파일은 `'use client'` 강제).

---

## 라우트 정합성

### 13. Frontend 라우트 경로가 backend prefix 와 불일치

```
❌ backend `APIRouter(prefix="/chat-session")` 인데 proxy 가 다른 문자열 호출
   const BACKEND_URL = env.DOCS_SERVICE_URL + "/chatSession"    (camelCase)
   const BACKEND_URL = env.DOCS_SERVICE_URL + "/chat-sessions"  (복수형)

✅ proxy 가 backend prefix 와 byte-identical
   const BACKEND_URL = env.DOCS_SERVICE_URL + "/chat-session"
```

**룰**: external proxy route 가 호출하는 backend path — `{SERVICE}_SERVICE_URL + "<P>"` 의 `<P>` — 의 prefix 부분이 실제 backend `APIRouter(prefix=...)` 와 **byte-identical** (sub-path 호출 시 prefix + 추가 segment). backend 가 SoT — case 변환·복수형화·임의 rename·재유도 금지. external 디렉토리(`app/api/external/{service}/{prefix}/`)는 frontend 그룹핑이라 디렉토리명 자체는 자유지만 **proxied `<P>` 는 backend 와 일치해야** 한다. client `BASE_URL`(`/api/external/{service}/{prefix}`)·admin page(`app/(main)/admin/{service}/{prefix}/`)·1:N `{child_route}` 도 동일. backend prefix 변경 시 lockstep. (route 컨벤션 = [`design-patterns-backend.md`](design-patterns-backend.md) 의 "라우트 (REST) 컨벤션")

**Detection** (📍 — proxied path 와 backend prefix cross-side 대조):
```bash
# frontend external proxy 가 호출하는 backend path
grep -rhoE '_SERVICE_URL \+ "/[^"]*"' frontend/app/api/external/ 2>/dev/null | grep -oE '"/[^"]*"' | sort -u
# 실제 backend prefix 전체 (모든 backend)
grep -rhoE 'APIRouter\(prefix="/[^"]*"' */app/routers 2>/dev/null | grep -oE '"/[^"]*"' | sort -u
```
각 proxied `<P>` 가 backend prefix 중 하나로 **시작**하는지 대조 (보통 정확히 일치, sub-path 면 prefix + segment). case/복수형/오타로 어긋나면 위반.

**예외**:
- **Prisma 직접 (`app/api/common/*`)**: 대응 backend prefix 없음 (frontend 가 route 를 정의) — 본 룰 대상 아님.
- **Frontend-only 구성** (backend `app/main.py` 없음): `app/api/external/` 부재 → 통과.
- **비-CRUD 계층형/동사 prefix** (`/agent/run`, `/market/stream`, `/nav/aggregate`) + **외부 API 미러 복수형** (`/mlflow/experiments`): backend 와 일치하기만 하면 정상 — CRUD 명사/단수 규칙으로 위반 처리 안 함 (backend "라우트 (REST) 컨벤션" 예외).
