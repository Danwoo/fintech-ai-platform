// app/api/common/system/company/options/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

/**
 * [GET] /api/common/system/company/options
 * 활성 회사 목록 (SelectBox 드롭다운용 - 페이지네이션 없음)
 * - 시스템관리자: 전체 회사
 * - 운영자: 자기 회사만 (다른 회사명 노출 방지)
 */
const getHandler = async (_req: NextRequest, session: any) => {
  const operation = "GET";
  try {
    const where: any = { use_at: "Y" };
    if (!session.user.isSysAdmin) {
      where.id = session.user.companyId ?? -1;
    }

    const items = await prisma.company.findMany({
      where,
      select: { id: true, company_code: true, company_nm: true },
      orderBy: { id: "asc" },
    });

    return createSuccessResponse({ items });
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireOperatorOrAdmin: true });
