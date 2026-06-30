import { env } from "@/env";
// app/api/external/todo/[mber_no]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.BACKEND_SERVICE_URL + "/todo";

// [GET] 단건 조회 핸들러
const getHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "GET";

  try {
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.mber_no}`, {
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

// [PUT] 수정 핸들러
const putHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "PUT";

  try {
    const body = await req.json();
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.mber_no}`, {
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

// [DELETE] 삭제 핸들러
const deleteHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "DELETE";

  try {
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.mber_no}`, {
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

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
