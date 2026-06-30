// utils/common/api/server.ts
import axios from "axios";
import { NextResponse } from "next/server";

type ProxyMode = "json" | "stream" | "binary" | "passthrough" | "external";

/**
 * Backend / 외부 URL 프록시 호출 — mode 별로 다른 응답 형태 처리.
 *
 * - **json** (default): JSON in/out. axios 사용. `response.data` 반환.
 * - **stream**: SSE 응답 패스스루. `Response(backend.body, { Content-Type: text/event-stream })` 반환.
 * - **binary**: 바이너리 응답 + content-type 보존. `NextResponse(arrayBuffer, ...)` 반환.
 * - **passthrough**: 요청 body 패스스루 (대용량 multipart upload). 호출자가 `body: req.body, duplex: "half"` 지정.
 * - **external**: 외부 임의 URL 호출 (사용자 입력 URL 검증 등). raw `Response` 그대로 반환, caller 가 `.ok` / `.headers` / `.json()` 등 직접 처리.
 */
export async function proxyApiRequest(url: string, options: any = {}, mode: ProxyMode = "json"): Promise<any> {
  switch (mode) {
    case "json": {
      const response = await axios({ url, ...options });
      return response.data;
    }
    case "stream": {
      const resp = await fetch(url, options);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return new Response(JSON.stringify(err), {
          status: resp.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(resp.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
    case "binary": {
      const resp = await fetch(url, options);
      if (!resp.ok) return new NextResponse(null, { status: resp.status });
      const buffer = await resp.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": resp.headers.get("content-type") || "application/octet-stream",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
    case "passthrough": {
      const resp = await fetch(url, options);
      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    }
    case "external": {
      return await fetch(url, options);
    }
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unknown proxy mode: ${_exhaustive}`);
    }
  }
}
