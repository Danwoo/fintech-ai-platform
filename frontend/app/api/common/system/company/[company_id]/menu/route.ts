// app/api/common/system/company/[company_id]/menu/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";
import { isProtectedMenu } from "@/constants/protected";

/**
 * [GET] /api/common/system/company/[company_id]/menu
 * 회사에 부여된 메뉴 목록 + 전체 메뉴 목록 (DualSelectGrid 용)
 * 시스템 메뉴(msys*)는 회사 매핑 대상이 아니므로 allMenus 에서 제외 (권한만으로 노출).
 */
const getHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const company_id = Number(params.company_id);

  try {
    const company = await prisma.company.findUnique({ where: { id: company_id } });
    if (!company) {
      return createErrorResponse({ message: "회사를 찾을 수 없습니다." }, operation);
    }

    const companyMenusRaw = await prisma.companyMenu.findMany({ where: { company_id } });

    const allMenusRaw = await prisma.menu.findMany({
      orderBy: [{ menu_level: "asc" }, { sort_ordr: "asc" }],
    });
    const allMenus = allMenusRaw
      .filter((m) => !isProtectedMenu(m.menu_id))
      .map((m) => ({ menu_id: m.menu_id, menu_nm: m.menu_nm, menu_level: m.menu_level ?? 1, use_at: m.use_at }));

    const menuMap = new Map(allMenusRaw.map((m) => [m.menu_id, m]));
    const companyMenus = companyMenusRaw.map((cm) => {
      const m = menuMap.get(cm.menu_id);
      return {
        menu_id: cm.menu_id,
        reg_dt: formatDateTime(cm.reg_dt),
        menu: m ? { menu_nm: m.menu_nm, use_at: m.use_at } : undefined,
      };
    });

    return createSuccessResponse({ companyMenus, allMenus });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [POST] /api/common/system/company/[company_id]/menu
 * 회사에 메뉴 추가
 */
const postHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "POST";
  const company_id = Number(params.company_id);
  const data = await req.json();

  try {
    if (isProtectedMenu(data.menu_id)) {
      return createErrorResponse({ message: "시스템 메뉴는 회사에 부여할 수 없습니다." }, operation);
    }

    const existing = await prisma.companyMenu.findUnique({
      where: { company_id_menu_id: { company_id, menu_id: data.menu_id } },
    });

    if (existing) {
      return createErrorResponse({ message: "이미 등록된 메뉴입니다." }, operation);
    }

    const companyMenu = await prisma.companyMenu.create({
      data: {
        company_id,
        menu_id: data.menu_id,
        reg_id: session.user.email,
        reg_dt: getKSTTime(),
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
    });

    return createSuccessResponse({ message: "메뉴가 추가되었습니다.", data: companyMenu });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const POST = withAuth(postHandler, { requireSysAdmin: true });
