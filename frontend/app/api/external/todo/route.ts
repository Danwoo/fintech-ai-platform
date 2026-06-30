import { env } from "@/env";
// app/api/external/todo/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.BACKEND_SERVICE_URL + "/todo";

// [GET] /api/todo - 목록 조회 핸들러
const getHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const result = await proxyApiRequest(`${BACKEND_URL}`, {
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

// [POST] /api/todo - 등록 핸들러
const postHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "POST";

  try {
    const body = await req.json();
    const result = await proxyApiRequest(`${BACKEND_URL}`, {
      method: operation,
      data: body, // axios에서는 data로 body 전달
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
