export interface SSEChunk {
  type: string;
  error?: string;
  [key: string]: any;
}

export interface FetchSSEOptions<T extends SSEChunk = SSEChunk> {
  url: string;
  body?: any;
  onChunk: (chunk: T) => void;
  signal?: AbortSignal;
}

export async function fetchSSE<T extends SSEChunk = SSEChunk>({
  url,
  body,
  onChunk,
  signal,
}: FetchSSEOptions<T>): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // axios-shape 으로 throw 해서 getApiErrorMessage 가 동일 처리
    const err = new Error(`HTTP ${response.status}`) as any;
    err.response = { data: errorData, status: response.status };
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("ReadableStream not supported");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const chunk = JSON.parse(jsonStr) as T;

          if (chunk.type === "error") {
            const err = new Error("HTTP 500") as any;
            err.response = { data: { detail: chunk.error || "스트리밍 중 오류가 발생했습니다." }, status: 500 };
            throw err;
          }

          onChunk(chunk);
        } catch (e) {
          if (e instanceof SyntaxError) {
            console.warn("Failed to parse SSE chunk:", jsonStr);
            continue;
          }
          throw e;
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim() && buffer.trim().startsWith("data: ")) {
      const jsonStr = buffer.trim().slice(6);
      try {
        const chunk = JSON.parse(jsonStr) as T;
        if (chunk.type === "error") {
          const err = new Error("HTTP 500") as any;
          err.response = { data: { detail: chunk.error || "스트리밍 중 오류가 발생했습니다." }, status: 500 };
          throw err;
        }
        onChunk(chunk);
      } catch (e) {
        if (!(e instanceof SyntaxError)) throw e;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
