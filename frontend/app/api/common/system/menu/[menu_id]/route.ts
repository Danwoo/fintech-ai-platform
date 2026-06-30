// app/api/common/system/menu/[menu_id]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { getKSTTime, formatDateTime } from "@/utils/common/timeUtils";
import { isProtectedMenu } from "@/constants/protected";

/**
 * [GET] /api/system/menu/[menu_id]
 * 메뉴 상세 조회
 */
const getHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "GET";
  const { menu_id } = params;

  try {
    const menu = await prisma.menu.findUnique({ where: { menu_id } });

    if (!menu) {
      return createErrorResponse({ message: "메뉴를 찾을 수 없습니다." }, operation);
    }

    const parent = menu.upper_menu_id
      ? await prisma.menu.findUnique({ where: { menu_id: menu.upper_menu_id }, select: { menu_nm: true } })
      : null;

    return createSuccessResponse({
      ...menu,
      ParentGroup: parent?.menu_nm ?? "",
      reg_dt: formatDateTime(menu.reg_dt),
      mod_dt: formatDateTime(menu.mod_dt),
      is_protected: isProtectedMenu(menu_id),
    });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler, { requireSysAdmin: true });

/**
 * [PUT] /api/system/menu/[menu_id]
 * 메뉴 수정
 */
const putHandler = async (req: NextRequest, session: any, params: any) => {
  const operation = "PUT";
  const { menu_id } = params;
  const data = await req.json();

  try {
    if (isProtectedMenu(menu_id) && data.use_at === "N") {
      return createErrorResponse({ message: "시스템 메뉴는 미사용으로 변경할 수 없습니다." }, operation);
    }

    const menu = await prisma.menu.update({
      where: { menu_id },
      data: {
        menu_nm: data.menu_nm,
        upper_menu_id: data.upper_menu_id || null,
        menu_level: data.menu_level,
        sort_ordr: data.sort_ordr,
        url: data.url || null,
        use_at: data.use_at,
        icon: data.icon || null,
        mod_id: session.user.email,
        mod_dt: getKSTTime(),
      },
    });

    return createSuccessResponse({ message: "메뉴가 수정되었습니다.", data: menu });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const PUT = withAuth(putHandler, { requireSysAdmin: true });

/**
 * [DELETE] /api/system/menu/[menu_id]
 * 메뉴 삭제
 */
const deleteHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "DELETE";
  const { menu_id } = params;

  try {
    if (isProtectedMenu(menu_id)) {
      return createErrorResponse({ message: "시스템 메뉴는 삭제할 수 없습니다." }, operation);
    }

    const childCount = await prisma.menu.count({ where: { upper_menu_id: menu_id } });
    if (childCount > 0) {
      return createErrorResponse({ message: "하위 메뉴가 존재하여 삭제할 수 없습니다." }, operation);
    }

    await prisma.$transaction([
      prisma.authorMenu.deleteMany({ where: { menu_id } }),
      prisma.menu.delete({ where: { menu_id } }),
    ]);

    return createSuccessResponse({ message: "메뉴가 삭제되었습니다." });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const DELETE = withAuth(deleteHandler, { requireSysAdmin: true });
