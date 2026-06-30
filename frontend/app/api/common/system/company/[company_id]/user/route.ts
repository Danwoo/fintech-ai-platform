// app/api/common/system/company/[company_id]/user/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";
import { formatDateTime } from "@/utils/common/timeUtils";

/**
 * [GET] /api/common/system/company/[company_id]/user
 * 회사 소속 사용자 목록 (read-only, 시스템관리자가 회사 상세에서 멤버 조회 용)
 */
const getHandler = async (req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const company_id = Number(params.company_id);

  try {
    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    const baseWhere = { company_id };
    const where = { ...baseWhere, ...convertFilterToPrismaWhere(filter) };
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ reg_dt: "desc" }];

    const [list, total_count] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          email: true,
          name: true,
          dept: true,
          use_at: true,
          appr_at: true,
          reg_dt: true,
          author_members: { select: { author: { select: { author_nm: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items = list.map((item, index) => ({
      email: item.email,
      name: item.name,
      dept: item.dept,
      use_at: item.use_at,
      appr_at: item.appr_at,
      reg_dt: formatDateTime(item.reg_dt),
      author_nm: item.author_members.map((m) => m.author.author_nm).join(", "),
      rn: (skip || 0) + index + 1,
    }));

    return createSuccessResponse({ items, total_count });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });
