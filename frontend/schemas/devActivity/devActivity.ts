// schemas/devActivity/devActivity.ts — 포트폴리오 활동 요약 챗 응답/요청 타입

export interface AccountInfo {
  account_id: string; // 계좌·포트폴리오 식별자
  name: string; // 계좌·포트폴리오 표시명
  group: string; // 개인 / 법인 / 연금 … (소속 그룹)
  kind: "cash" | "margin" | "pension"; // cash=현금성, margin=신용, pension=연금
  last_activity: string; // 마지막 활동일 YYYY-MM-DD (최근 활성 그룹핑용)
}

export interface HolderInfo {
  username: string;
  name: string;
  email: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  account: string | null; // 좌측에서 선택한 단일 계좌·포트폴리오
  since?: string | null; // YYYY-MM-DD (조회기간 시작)
  until?: string | null;
  symbols?: string[]; // 종목 코드·티커 목록 (조회 범위 한정)
  holders?: string[]; // 계좌주 email
  kind?: string | null; // cash | margin | pension (자동탐색 범위)
  group?: string | null; // 소속 그룹 (자동탐색 범위)
  history?: ChatTurn[]; // 직전 대화 (멀티턴 — 서버 무상태, 매 요청 동봉)
}
