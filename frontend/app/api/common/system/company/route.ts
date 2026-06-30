// app/api/common/system/company/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";

/**
 * [GET] /api/common/system/company
 * 회사 목록 조회
 */
const getHandler = async (req: NextRequest, _session: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    const where = convertFilterToPrismaWhere(filter);
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ id: "asc" }];

    const [list, total_count] = await Promise.all([
      prisma.company.findMany({ where, orderBy, take, skip }),
      prisma.company.count({ where }),
    ]);

    const items = list.map((item, index) => ({
      ...item,
      rn: (skip || 0) + index + 1,
      reg_dt: formatDateTime(item.reg_dt),
      mod_dt: formatDateTime(item.mod_dt),
    }));

    return createSuccessResponse({ items, total_count });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [POST] /api/common/system/company
 * 회사 생성
 */
const postHandler = async (req: NextRequest, session: any) => {
  const operation = "POST";

  try {
    const data = await req.json();

    const company_code = String(data.company_code ?? "")
      .replace(/\s/g, "")
      .toLowerCase();

    const existing = await prisma.company.findUnique({ where: { company_code }, select: { id: true } });
    if (existing) {
      return createErrorResponse({ message: `이미 사용 중인 회사 코드입니다. (${company_code})` }, operation);
    }

    const company = await prisma.company.create({
      data: {
        company_code,
        company_nm: data.company_nm,
        use_at: data.use_at,
        reg_id: session.user.email,
        reg_dt: getKSTTime(),
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
    });

    return createSuccessResponse({ message: "회사가 생성되었습니다.", data: company });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const POST = withAuth(postHandler, { requireSysAdmin: true });
