// app/api/common/system/adminuser/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";
import { auth } from "@/lib/auth/auth";
import { isOEM } from "@/utils/common/edition";

/**
 * [GET] /api/system/adminuser
 * 관리자용 사용자 목록 조회 (서버사이드 페이징)
 */
const getHandler = async (req: NextRequest, session: any) => {
  const operation = "GET";

  try {
    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    // 운영자는 자기 회사 사용자만 조회 가능 (시스템관리자는 전체). companyId null 이면 -1 로 fail-closed.
    // 사용자 필터를 AND 로 묶어 클라가 보낸 filter 키가 tenantWhere 를 덮어쓰지 못하게 한다 (테넌트 격리 우회 방지).
    const tenantWhere = session.user.isSysAdmin ? {} : { company_id: session.user.companyId ?? -1 };
    const userFilter = convertFilterToPrismaWhere(filter);
    const where = Object.keys(userFilter).length > 0 ? { AND: [tenantWhere, userFilter] } : tenantWhere;
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ company: { company_nm: "asc" } }, { reg_dt: "desc" }];

    const [list, total_count] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true,
          email: true,
          name: true,
          dept: true,
          company_id: true,
          use_at: true,
          appr_at: true,
          reg_dt: true,
          reg_id: true,
          mod_dt: true,
          mod_id: true,
          author_members: { select: { author_id: true, author: { select: { author_nm: true } } } },
          company: { select: { company_nm: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items = list.map((item, index) => ({
      ...item,
      rn: (skip || 0) + index + 1,
      reg_dt: formatDateTime(item.reg_dt),
      mod_dt: formatDateTime(item.mod_dt),
      author_nm: item.author_members.map((m) => m.author.author_nm).join(", "),
      company_nm: item.company?.company_nm ?? null,
      author_members: undefined,
      company: undefined,
    }));

    return createSuccessResponse({ items, total_count });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireOperatorOrAdmin: true });

/**
 * [POST] /api/system/adminuser
 * 관리자용 사용자 생성
 */
const postHandler = async (req: NextRequest, session: any) => {
  const operation = "POST";
  const data = await req.json();
  const { email, password, name, dept, use_at, appr_at } = data;

  // company_id 결정. OEM 은 단일 활성 회사로 강제(클라/세션 무시), SaaS 는 운영자만 자기 회사로 강제.
  let company_id: number | null;
  if (isOEM()) {
    // OEM: DB 유일 활성 회사로 배정. 0개/2개+ 는 불변식 위반 → fail-loud (signup 가드와 동일).
    const companies = await prisma.company.findMany({ where: { use_at: "Y" }, select: { id: true } });
    if (companies.length === 0) {
      return createErrorResponse({ message: "OEM: 활성 회사가 없습니다." }, operation);
    }
    if (companies.length > 1) {
      return createErrorResponse({ message: "OEM: 활성 회사가 2개 이상입니다 (설정 오류)." }, operation);
    }
    company_id = companies[0].id;
  } else {
    company_id = session.user.isSysAdmin ? (data.company_id ?? null) : (session.user.companyId ?? null);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { email: true } });
    if (existing) {
      return createErrorResponse({ message: `이미 사용 중인 이메일입니다. (${email})` }, operation);
    }

    const now = getKSTTime();

    // Better Auth로 사용자 생성 (TN_User + BA_Account)
    await auth.api.signUpEmail({
      body: { email, password, name: name || email },
    });

    // 커스텀 필드 업데이트
    await prisma.user.update({
      where: { email },
      data: {
        dept: dept || null,
        company_id,
        use_at,
        appr_at,
        reg_dt: now,
        reg_id: session.user.email,
        mod_dt: now,
        mod_id: session.user.email,
      },
    });

    return createSuccessResponse({ message: "사용자가 생성되었습니다.", data: { email } });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const POST = withAuth(postHandler, { requireOperatorOrAdmin: true });
