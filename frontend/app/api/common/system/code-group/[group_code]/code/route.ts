// app/api/common/system/code-group/[group_code]/code/route.ts
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSuccessResponse, createErrorResponse } from "@/utils/common/api/responses";
import { convertFilterToPrismaWhere, convertSortToPrismaOrderBy } from "@/lib/devextreme/filters";
import { getKSTTime } from "@/utils/common/timeUtils";

/**
 * [GET] /api/common/system/code-group/[group_code]/code
 * - group_code: 코드 그룹 식별자
 * - 코드 그룹 내 코드 목록 조회 (서버사이드 페이징 지원)
 */
const getHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "GET";

  try {
    // 코드 그룹 존재 여부 확인
    const groupCode = await prisma.groupCode.findUnique({
      where: { group_code: params.group_code },
    });

    if (!groupCode) {
      return createErrorResponse(
        {
          code: "P2025",
        },
        operation,
      );
    }

    const { searchParams } = new URL(req.url);
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    // 기본 where 조건에 group_code 추가
    const baseWhere = { group_code: params.group_code };
    const additionalWhere = convertFilterToPrismaWhere(filter);
    const where = { ...baseWhere, ...additionalWhere };

    // 정렬 조건 (기본값: sort_ordr 오름차순)
    const orderBy = convertSortToPrismaOrderBy(sort) || [{ sort_ordr: "asc" }];

    // 페이징이 있는 경우와 없는 경우 분기
    let codes;
    let total_count;

    if (take !== undefined || skip !== undefined) {
      // 서버사이드 페이징
      codes = await prisma.code.findMany({
        take,
        skip,
        where,
        orderBy,
      });

      total_count = await prisma.code.count({ where });
    } else {
      // 모든 데이터 조회 (deleteCodeGroup에서 사용)
      codes = await prisma.code.findMany({
        where,
        orderBy,
      });

      total_count = codes.length;
    }

    const items = codes.map((code, index) => ({
      ...code,
      rn: (skip || 0) + index + 1,
      reg_dt: code.reg_dt?.toISOString().replace("T", " ").substring(0, 19),
      mod_dt: code.mod_dt?.toISOString().replace("T", " ").substring(0, 19),
    }));

    const result = {
      items: items,
      total_count: total_count,
      group_code: params.group_code,
      group_code_nm: groupCode.group_code_nm,
    };

    return createSuccessResponse(result, operation);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

/**
 * [POST] /api/common/system/code-group/[group_code]/code
 * - group_code: 코드 그룹 식별자
 * - 코드 그룹 내 코드 생성
 * - 생성할 코드 정보를 body로 전달
 */
const postHandler = async (req: NextRequest, session: any, params?: any) => {
  const operation = "POST";

  try {
    const body: { [key: string]: any } = await req.json();

    const allowedFields = ["code", "code_nm", "code_nm_eng", "code_dc", "sort_ordr", "use_at"];

    const createData = Object.keys(body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    createData.code = String(createData.code ?? "")
      .replace(/\s/g, "")
      .toLowerCase();

    const existing = await prisma.code.findUnique({
      where: { group_code_code: { group_code: params.group_code, code: createData.code } },
      select: { code: true },
    });
    if (existing) {
      return createErrorResponse({ message: `이미 사용 중인 코드입니다. (${createData.code})` }, operation);
    }

    const result = await prisma.code.create({
      data: {
        ...createData,
        group_code: params.group_code,
        reg_dt: getKSTTime(),
        mod_dt: getKSTTime(),
        reg_id: session.user.email,
        mod_id: session.user.email,
      },
    });

    return createSuccessResponse(
      {
        data: result,
      },
      operation,
    );
  } catch (error) {
    return createErrorResponse(error, operation);
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler, { requireSysAdmin: true });
