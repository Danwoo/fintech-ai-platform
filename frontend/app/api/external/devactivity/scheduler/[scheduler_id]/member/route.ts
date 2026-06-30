// app/api/external/devactivity/scheduler/[scheduler_id]/member/route.ts
import { env } from "@/env";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.DEV_ACTIVITY_SERVICE_URL + "/scheduler";

// [GET] 멤버 목록 조회 핸들러
const getHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "GET";

  try {
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.scheduler_id}/member`, {
      method: operation,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

// [POST] 멤버 추가 핸들러
const postHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "POST";

  try {
    const body = await req.json();
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.scheduler_id}/member`, {
      method: operation,
      data: body,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });
export const POST = withAuth(postHandler, { requireSysAdmin: true });
