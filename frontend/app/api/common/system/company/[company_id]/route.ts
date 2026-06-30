// app/api/common/system/company/[company_id]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";

/**
 * [GET] /api/common/system/company/[company_id]
 * 회사 상세 조회
 */
const getHandler = async (req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const id = Number(params.company_id);

  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return createErrorResponse({ message: "회사를 찾을 수 없습니다." }, operation);
    }

    return createSuccessResponse({
      ...company,
      reg_dt: formatDateTime(company.reg_dt),
      mod_dt: formatDateTime(company.mod_dt),
    });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [PUT] /api/common/system/company/[company_id]
 * 회사 수정
 */
const putHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "PUT";
  const id = Number(params.company_id);
  const data = await req.json();

  try {
    // 마지막 활성 회사 비활성화 차단 — OEM 단일회사 self-lock(가입·사용자생성 전면 중단) 방지.
    if (data.use_at === "N") {
      const otherActive = await prisma.company.count({ where: { use_at: "Y", id: { not: id } } });
      if (otherActive === 0) {
        return createErrorResponse({ message: "마지막 활성 회사는 비활성화할 수 없습니다." }, operation);
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        company_nm: data.company_nm,
        use_at: data.use_at,
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
    });

    // 회사 비활성화 시 소속 사용자 전원 세션 무효화 → 다음 요청에서 로그인 차단됨
    if (data.use_at === "N") {
      const targets = await prisma.user.findMany({ where: { company_id: id }, select: { id: true } });
      if (targets.length > 0) {
        await prisma.baSession.deleteMany({ where: { userId: { in: targets.map((u) => u.id) } } });
      }
    }

    return createSuccessResponse({ message: "회사 정보가 수정되었습니다.", data: company });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const PUT = withAuth(putHandler, { requireSysAdmin: true });

// DELETE 차단: 회사는 영구 보존. 폐쇄 시 use_at='N' 으로 soft delete — 그 회사 사용자 세션 자동 무효화 + 로그인 차단.
