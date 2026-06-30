// app/api/common/system/author/[author_id]/user/[user_id]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { SYS_ADMIN_AUTHOR_ID, isSysAdminAuthor } from "@/constants/protected";
import { invalidateUserSessions, checkLastActiveSysAdmin } from "@/lib/auth/authUtils";

/**
 * [DELETE] /api/system/author/[author_id]/user/[user_id]
 * 권한에서 사용자 제거
 */
const deleteHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "DELETE";
  const { author_id, user_id } = params;

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

    // 운영자: 자기 회사 사용자의 권한만 제거 가능. company 없는 운영자는 fail-closed (null===null 매칭 방지).
    if (!session.user.isSysAdmin) {
      if (session.user.companyId == null) {
        return createErrorResponse({ message: "사용자를 찾을 수 없습니다." }, operation);
      }
      const target = await prisma.user.findUnique({
        where: { email: user_id },
        select: { company_id: true },
      });
      if (!target || target.company_id !== session.user.companyId) {
        return createErrorResponse({ message: "사용자를 찾을 수 없습니다." }, operation);
      }
    }

    if (isSysAdminAuthor(author_id)) {
      const guardMsg = await checkLastActiveSysAdmin(user_id);
      if (guardMsg) return createErrorResponse({ message: guardMsg }, operation);
    }

    await prisma.authorMember.delete({
      where: { author_id_user_id: { author_id, user_id } },
    });

    // 권한 변경 시 BaSession 의 authorId denormalize 가 stale 해지므로 무효화
    await invalidateUserSessions(user_id);

    return createSuccessResponse({ message: "사용자가 권한에서 제거되었습니다." });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const DELETE = withAuth(deleteHandler, { requireOperatorOrAdmin: true });
