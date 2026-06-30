// services/devActivity/devActivityService.ts
import { apiCall } from "@/utils/common/api/client";
import { AccountInfo, HolderInfo, ChatRequest } from "@/schemas/devActivity/devActivity";

const BASE_URL = "/api/external/devactivity/chat";

/** 계좌·포트폴리오 목록 (account_id·group·kind) — 좌측 목록 + 계좌 범위 필터용 */
export const selectAccounts = async (): Promise<AccountInfo[]> => {
  const res = await apiCall<{ items: AccountInfo[]; total_count: number }>(`${BASE_URL}/accounts`, { method: "GET" });
  return res?.items ?? [];
};

/** 계좌주 목록 — 계좌주 필터 드롭다운용 */
export const selectHolders = async (): Promise<HolderInfo[]> => {
  const res = await apiCall<{ items: HolderInfo[]; total_count: number }>(`${BASE_URL}/holders`, { method: "GET" });
  return res?.items ?? [];
};

interface StreamChatOptions {
  onStatus?: (text: string) => void; // 진행 단계 (질의 분석 / 포트폴리오 조회 …)
  onDelta: (text: string) => void; // 답변 토큰
  signal?: AbortSignal;
}

/**
 * 질문을 보내고 진행상태(onStatus)·답변 토큰(onDelta)을 SSE 로 받아 흘려보낸다 (멀티턴 — history 동봉).
 * 스트리밍은 apiCall(axios) 로 소비 불가하여 fetch 직접 사용 (rule 6 예외).
 */
export const streamChat = async (req: ChatRequest, { onStatus, onDelta, signal }: StreamChatOptions): Promise<void> => {
  const resp = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => null);
    throw err ?? new Error("스트리밍 요청에 실패했습니다.");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // 마지막 미완성 라인 보존
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      let obj: { content?: string; status?: string; error?: string };
      try {
        obj = JSON.parse(payload);
      } catch {
        continue;
      }
      if (obj.error) throw new Error(obj.error);
      if (obj.status) onStatus?.(obj.status);
      if (obj.content) onDelta(obj.content);
    }
  }
};
