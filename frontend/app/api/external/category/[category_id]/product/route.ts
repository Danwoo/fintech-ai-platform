// app/api/external/category/[category_id]/product/route.ts
import { env } from "@/env";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { proxyApiRequest } from "@/utils/common/api/server";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

const BACKEND_URL = env.BACKEND_SERVICE_URL + "/category";

// [GET] 상품 목록 조회
const getHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const result = await proxyApiRequest(`${BACKEND_URL}/${params.category_id}/product`, {
      method: operation,
      params: queryParams,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

// [POST] 상품 등록
const postHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "POST";

  try {
    const body = await req.json();
    const result = await proxyApiRequest(`${BACKEND_URL}/${params.category_id}/product`, {
      method: operation,
      data: body,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
