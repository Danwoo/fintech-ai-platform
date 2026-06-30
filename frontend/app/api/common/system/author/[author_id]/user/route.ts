// app/api/common/system/author/[author_id]/user/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { getKSTTime } from "@/utils/common/timeUtils";
import { SYS_ADMIN_AUTHOR_ID, isSysAdminAuthor } from "@/constants/protected";
import { invalidateUserSessions } from "@/lib/auth/authUtils";

/**
 * [GET] /api/system/author/[author_id]/user
 * 권한에 속한 사용자 목록 + 전체 사용자 목록 조회
 */
const getHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const { author_id } = params;

  try {
    const authorMembers = await prisma.authorMember.findMany({
      where: { author_id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            use_at: true,
            appr_at: true,
            company: { select: { company_nm: true } },
          },
        },
      },
    });

    const authorUsers = authorMembers.map((item) => ({
      author_id: item.author_id,
      user_id: item.user_id,
      user_nm: item.user?.name || "",
      use_at: item.user?.use_at ?? "Y",
      appr_at: item.user?.appr_at ?? "N",
      company_nm: item.user?.company?.company_nm ?? "",
    }));

    const allUsersRaw = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        use_at: true,
        appr_at: true,
        company: { select: { company_nm: true } },
      },
      orderBy: { email: "asc" },
    });

    const allUsers = allUsersRaw.map((item) => ({
      user_id: item.email,
      user_nm: item.name || "",
      use_at: item.use_at,
      appr_at: item.appr_at,
      company_nm: item.company?.company_nm ?? "",
    }));

    return createSuccessResponse({ authorUsers, allUsers });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [POST] /api/system/author/[author_id]/user
 * 권한에 사용자 추가
 */
const postHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "POST";
  const { author_id } = params;
  const data = await req.json();

  try {
    if (isSysAdminAuthor(author_id)) {
      const isSysAdmin = await prisma.authorMember.count({
        where: { author_id: SYS_ADMIN_AUTHOR_ID, user_id: session.user.email },
      });
      if (!isSysAdmin) {
        return createErrorResponse(
          { message: "시스템관리자 권한의 사용자는 시스템관리자만 관리할 수 있습니다." },
          operation,
        );
      }
    }

    // 운영자: 자기 회사 사용자에게만 권한 부여 가능. company 없는 운영자는 fail-closed (null===null 매칭 방지).
    if (!session.user.isSysAdmin) {
      if (session.user.companyId == null) {
        return createErrorResponse({ message: "사용자를 찾을 수 없습니다." }, operation);
      }
      const target = await prisma.user.findUnique({
        where: { email: data.user_id },
        select: { company_id: true },
      });
      if (!target || target.company_id !== session.user.companyId) {
        return createErrorResponse({ message: "사용자를 찾을 수 없습니다." }, operation);
      }
    }

    const existing = await prisma.authorMember.findUnique({
      where: { author_id_user_id: { author_id, user_id: data.user_id } },
    });

    if (existing) {
      return createErrorResponse({ message: "이미 부여된 권한입니다." }, operation);
    }

    const authorMember = await prisma.authorMember.create({
      data: {
        author_id,
        user_id: data.user_id,
        reg_id: session.user.email,
        reg_dt: getKSTTime(),
      },
    });

    // 권한 변경 시 BaSession 의 authorId denormalize 가 stale 해지므로 무효화
    await invalidateUserSessions(data.user_id);

    return createSuccessResponse({ message: "사용자가 권한에 추가되었습니다.", data: authorMember });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const POST = withAuth(postHandler, { requireOperatorOrAdmin: true });
