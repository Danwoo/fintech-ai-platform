// app/api/common/system/company/[company_id]/domain/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";
import { isPublicEmailDomain } from "@/constants/protected";

/**
 * [GET] /api/common/system/company/[company_id]/domain
 * 회사 도메인 목록 조회
 */
const getHandler = async (req: NextRequest, _session: any, params: any) => {
  const operation = "GET";

  try {
    const id = Number(params.company_id);
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return createErrorResponse({ code: "P2025" }, operation);
    }

    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    const baseWhere = { company_id: id };
    const where = { ...baseWhere, ...convertFilterToPrismaWhere(filter) };
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ domain: "asc" }];

    const [list, total_count] = await Promise.all([
      prisma.companyDomain.findMany({ where, orderBy, take, skip }),
      prisma.companyDomain.count({ where }),
    ]);

    const items = list.map((item, index) => ({
      ...item,
      rn: (skip || 0) + index + 1,
      reg_dt: formatDateTime(item.reg_dt),
      mod_dt: formatDateTime(item.mod_dt),
    }));

    return createSuccessResponse({ items, total_count, company_id: id, company_nm: company.company_nm });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [POST] /api/common/system/company/[company_id]/domain
 * 회사 도메인 생성
 */
const postHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "POST";

  try {
    const body = await req.json();
    const domain = String(body.domain ?? "")
      .toLowerCase()
      .trim();

    // 형식 검증 (DB-only 우회 시도 시 마지막 방어선)
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
      return createErrorResponse({ message: "올바른 도메인 형식이 아닙니다 (예: example.com)." }, operation);
    }

    // 공용/개인 이메일 도메인은 회사 도메인으로 등록 불가
    if (isPublicEmailDomain(domain)) {
      return createErrorResponse({ message: "공용 이메일 도메인은 회사 도메인으로 등록할 수 없습니다." }, operation);
    }

    const id = Number(params.company_id);

    // 다른 회사가 이미 사용 중인지 명시적 안내
    const existingDomain = await prisma.companyDomain.findUnique({
      where: { domain },
      select: { company_id: true },
    });
    if (existingDomain) {
      const msg =
        existingDomain.company_id === id ? "이미 등록된 도메인입니다." : "다른 회사가 사용 중인 도메인입니다.";
      return createErrorResponse({ message: msg }, operation);
    }

    const result = await prisma.companyDomain.create({
      data: {
        domain,
        company_id: id,
        reg_id: session.user.email,
        reg_dt: getKSTTime(),
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
    });

    return createSuccessResponse({ message: "도메인이 등록되었습니다.", data: result });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const POST = withAuth(postHandler, { requireSysAdmin: true });
