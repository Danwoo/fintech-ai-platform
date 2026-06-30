// app/api/external/devactivity/scheduler/[scheduler_id]/run/route.ts
import { env } from "@/env";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.DEV_ACTIVITY_SERVICE_URL + "/scheduler";

// [POST] 스케줄러 즉시 실행 핸들러
const postHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "POST";

  try {
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.scheduler_id}/run`, {
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

export const POST = withAuth(postHandler, { requireSysAdmin: true });
