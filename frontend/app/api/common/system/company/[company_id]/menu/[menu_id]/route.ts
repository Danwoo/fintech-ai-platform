// app/api/common/system/company/[company_id]/menu/[menu_id]/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";

/**
 * [DELETE] /api/common/system/company/[company_id]/menu/[menu_id]
 * 회사에서 메뉴 제거
 */
const deleteHandler = async (_req: NextRequest, _session: any, params: any) => {
  const operation = "DELETE";
  const company_id = Number(params.company_id);
  const { menu_id } = params;

  try {
    await prisma.companyMenu.delete({
      where: { company_id_menu_id: { company_id, menu_id } },
    });

    return createSuccessResponse({ message: "메뉴가 제거되었습니다." });
  } catch (error: any) {
    console.error(`[${operation}] Error:`, error);
    return createErrorResponse(error, operation);
  }
};

export const DELETE = withAuth(deleteHandler, { requireSysAdmin: true });
