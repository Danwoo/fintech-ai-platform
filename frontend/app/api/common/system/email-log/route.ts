import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";

/**
 * [GET] /api/common/system/email-log
 * 시스템관리자: 전체 / 운영자: 자기 회사 사용자에게 발송된 로그만
 */
const getHandler = async (req: NextRequest, session: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    let tenantWhere: any = {};
    if (!session.user.isSysAdmin) {
      // 운영자: 자기 회사 등록 사용자 이메일 + 회사 등록 도메인 OR 매칭
      // (도메인은 같지만 외부 등록된 이메일 / 등록 안 된 회사 직원 양쪽 모두 커버)
      const companyId = session.user.companyId ?? -1;
      const [companyUsers, companyDomains] = await Promise.all([
        prisma.user.findMany({
          where: { company_id: companyId },
          select: { email: true },
        }),
        prisma.companyDomain.findMany({
          where: { company_id: companyId },
          select: { domain: true },
        }),
      ]);
      const userEmails = companyUsers.map((u) => u.email);
      const domains = companyDomains.map((d) => d.domain);
      const orConds: any[] = [];
      if (userEmails.length > 0) orConds.push({ to: { in: userEmails } });
      domains.forEach((d) => orConds.push({ to: { endsWith: `@${d}` } }));
      // 둘 다 비어있으면 매칭 0건 (fail-closed)
      tenantWhere = orConds.length > 0 ? { OR: orConds } : { to: "__none__" };
    }

    // 사용자 필터를 AND 로 묶는다 — filter 의 OR 키가 tenantWhere OR 를 덮어써 전 회사 로그가 노출되는 우회 차단.
    const userFilter = convertFilterToPrismaWhere(filter);
    const where = Object.keys(userFilter).length > 0 ? { AND: [tenantWhere, userFilter] } : tenantWhere;
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ reg_dt: "desc" }];

    const [list, total_count] = await Promise.all([
      prisma.emailLog.findMany({ take, skip, where, orderBy }),
      prisma.emailLog.count({ where }),
    ]);

    const items = list.map((item, index) => ({
      ...item,
      rn: (skip || 0) + index + 1,
      reg_dt: item.reg_dt.toISOString().replace("T", " ").substring(0, 19),
    }));

    return createSuccessResponse({ items, total_count });
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireOperatorOrAdmin: true });
