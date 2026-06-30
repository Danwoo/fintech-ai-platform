// app/api/common/system/adminuser/options/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { SYS_ADMIN_AUTHOR_ID } from "@/constants/protected";

/**
 * [GET] /api/common/system/adminuser/options
 * 사용자 선택 피커용 경량 목록 (승인+활성 사용자만).
 * - 시스템관리자: 전체 사용자 (회사명 포함)
 * - 운영자: 자기 회사 사용자만
 * 사용자↔회사 매핑은 공통 DB(Prisma)에만 있으므로 후보 목록은 이 프론트 라우트가 제공한다.
 * 시스템관리자(admin) 보유자는 모든 프로젝트에 자동 접근하므로 멤버 추가 후보에서 제외한다.
 */
const getHandler = async (_req: NextRequest, session: any) => {
  const operation = "GET";

  try {
    // 시스템관리자(admin) 권한 보유자 이메일 — 멤버 후보에서 제외 (이미 전 프로젝트 접근)
    const adminMembers = await prisma.authorMember.findMany({
      where: { author_id: SYS_ADMIN_AUTHOR_ID },
      select: { user_id: true },
    });
    const adminEmails = adminMembers.map((m) => m.user_id);

    const where = {
      // 운영자는 자기 회사만. companyId null(미매핑 비정상) 이면 -1 로 매칭 0건 (fail-closed)
      ...(session.user.isSysAdmin ? {} : { company_id: session.user.companyId ?? -1 }),
      use_at: "Y",
      appr_at: "Y",
      ...(adminEmails.length > 0 ? { email: { notIn: adminEmails } } : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        dept: true,
        company: { select: { company_nm: true } },
      },
      orderBy: { email: "asc" },
    });

    const items = users.map((u) => ({
      user_id: u.id,
      email: u.email,
      name: u.name ?? "",
      dept: u.dept ?? "",
      company_nm: u.company?.company_nm ?? "",
    }));

    return createSuccessResponse({ items });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireOperatorOrAdmin: true });
