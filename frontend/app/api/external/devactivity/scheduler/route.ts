// app/api/external/devactivity/scheduler/route.ts
import { env } from "@/env";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.DEV_ACTIVITY_SERVICE_URL + "/scheduler";

// [GET] 목록 조회 핸들러
const getHandler = async (req: NextRequest, session: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const result = await proxyApiRequest(BACKEND_URL, {
      method: operation,
      params: queryParams,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

// [POST] 등록 핸들러
const postHandler = async (req: NextRequest, session: any) => {
  const operation = "POST";

  try {
    const body = await req.json();
    const result = await proxyApiRequest(BACKEND_URL, {
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
