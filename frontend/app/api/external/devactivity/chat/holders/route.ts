// app/api/external/devactivity/chat/holders/route.ts
import { env } from "@/env";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.DEV_ACTIVITY_SERVICE_URL + "/chat/holders";

// [GET] 계좌주 필터 드롭다운용 목록
const getHandler = async (_req: NextRequest, session: any) => {
  const operation = "GET";
  try {
    const result = await proxyApiRequest(BACKEND_URL, {
      method: operation,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });
