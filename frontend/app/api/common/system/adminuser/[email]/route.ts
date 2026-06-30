// app/api/common/system/adminuser/[email]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";
import { hashPassword, invalidateUserSessions, checkLastActiveSysAdmin } from "@/lib/auth/authUtils";
import { GENERAL_ADMIN_AUTHOR_ID, DEFAULT_USER_AUTHOR_ID } from "@/constants/protected";

/**
 * [GET] /api/system/adminuser/[email]
 * 사용자 상세 조회
 */
const getHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const { email } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
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
        company: { select: { company_nm: true } },
      },
    });

    if (!user) {
      return createErrorResponse({ message: "사용자를 찾을 수 없습니다." }, operation);
    }

    return createSuccessResponse({
      ...user,
      company_nm: user.company?.company_nm ?? null,
      company: undefined,
      reg_dt: formatDateTime(user.reg_dt),
      mod_dt: formatDateTime(user.mod_dt),
    });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { scopeEmailParam: "email", requireOperatorOrAdmin: true });

/**
 * [PUT] /api/system/adminuser/[email]
 * 사용자 수정 (관리자용 - name, dept, use_at 변경 가능)
 */
const putHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "PUT";
  const { email } = params;
  const data = await req.json();

  try {
    // 회사 격리 + 시스템관리자 계정 보호는 withAuth(scopeEmailParam/protectSysAdminTarget) 가 처리.
    // 여기선 운영자의 회사 변경 시도만 차단 + 자기 회사로 고정.
    if (!session.user.isSysAdmin) {
      if (data.company_id && data.company_id !== session.user.companyId) {
        return createErrorResponse({ message: "다른 회사로 이동할 수 없습니다." }, operation);
      }
      data.company_id = session.user.companyId;
    }

    const willBeInactive = (data.use_at && data.use_at !== "Y") || (data.appr_at && data.appr_at !== "Y");
    if (willBeInactive) {
      const guardMsg = await checkLastActiveSysAdmin(email);
      if (guardMsg) return createErrorResponse({ message: guardMsg }, operation);
    }

    // 비밀번호 변경 시 BA_Account 업데이트
    if (data.password) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        await prisma.baAccount.updateMany({
          where: { userId: existingUser.id, providerId: "credential" },
          data: { password: await hashPassword(data.password) },
        });
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { company_id: true, use_at: true, appr_at: true },
    });

    const user = await prisma.user.update({
      where: { email },
      data: {
        name: data.name,
        dept: data.dept || null,
        company_id: data.company_id ?? null,
        use_at: data.use_at,
        appr_at: data.appr_at,
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
      select: {
        email: true,
        name: true,
        dept: true,
        company_id: true,
        use_at: true,
        appr_at: true,
        reg_dt: true,
        mod_dt: true,
      },
    });

    // 회사 변경 시 이전 회사 종속인 일반관리자(002) 제거 (시스템관리자(001)는 회사 무관 유지).
    const companyChanged = existing && existing.company_id !== user.company_id;
    if (companyChanged) {
      await prisma.authorMember.deleteMany({
        where: { user_id: email, author_id: GENERAL_ADMIN_AUTHOR_ID },
      });
    }

    // 회사 배정(SaaS) 또는 승인 전환(OEM, appr_at N→Y) 시 일반사용자(003) 권한이 없으면 부여 → 즉시 사용 가능.
    const approvedNow = existing && existing.appr_at !== "Y" && user.appr_at === "Y";
    if (companyChanged || approvedNow) {
      const hasDefault = await prisma.authorMember.count({
        where: { user_id: email, author_id: DEFAULT_USER_AUTHOR_ID },
      });
      if (!hasDefault) {
        await prisma.authorMember.create({
          data: {
            author_id: DEFAULT_USER_AUTHOR_ID,
            user_id: email,
            reg_id: session.user.email,
            reg_dt: getKSTTime(),
            mod_id: session.user.email,
            mod_dt: getKSTTime(),
          },
        });
      }
    }

    // 회사 변경 or 비활성 처리 시 기존 세션 무효화 (JWT/BaSession stale 방지)
    const becameInactive = data.use_at === "N" || data.appr_at !== "Y";
    if (companyChanged || becameInactive) {
      await invalidateUserSessions(email);
    }

    return createSuccessResponse({ message: "사용자 정보가 수정되었습니다.", data: user });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const PUT = withAuth(putHandler, {
  scopeEmailParam: "email",
  protectSysAdminTarget: true,
  requireOperatorOrAdmin: true,
});

/**
 * [DELETE] /api/system/adminuser/[email]
 * 사용자 삭제 (관련 세션, 권한 멤버 연쇄 삭제)
 */
const deleteHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "DELETE";
  const { email } = params;

  try {
    // 회사 격리 + 시스템관리자 계정 보호는 withAuth(scopeEmailParam/protectSysAdminTarget) 가 처리.
    const guardMsg = await checkLastActiveSysAdmin(email);
    if (guardMsg) return createErrorResponse({ message: guardMsg }, operation);

    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.$transaction([
      prisma.authorMember.deleteMany({ where: { user_id: email } }),
      ...(user
        ? [
            prisma.baSession.deleteMany({ where: { userId: user.id } }),
            prisma.baAccount.deleteMany({ where: { userId: user.id } }),
          ]
        : []),
      prisma.user.delete({ where: { email } }),
    ]);

    return createSuccessResponse({ message: "사용자가 삭제되었습니다." });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const DELETE = withAuth(deleteHandler, {
  scopeEmailParam: "email",
  protectSysAdminTarget: true,
  requireOperatorOrAdmin: true,
});
