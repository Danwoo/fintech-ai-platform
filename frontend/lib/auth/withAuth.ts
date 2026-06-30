// lib/auth/withAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { createErrorResponse } from "@/utils/common/api/responses";
import { SYS_ADMIN_AUTHOR_ID, GENERAL_ADMIN_AUTHOR_ID } from "@/constants/protected";
import { assertSameCompanyOrSysAdmin, assertTargetNotSysAdmin } from "@/lib/auth/authUtils";

// 일반 API 핸들러 (JSON 응답)
type JsonHandler = (request: NextRequest, session: any, params?: any) => Promise<NextResponse> | NextResponse;

// 파일 스트림 핸들러 (바이너리 응답)
type StreamHandler = (request: NextRequest, session: any, params?: any) => Promise<Response> | Response;

// 통합 핸들러 타입
type AuthenticatedHandler = JsonHandler | StreamHandler;

interface WithAuthOptions {
  /** true 면 시스템관리자만 핸들러 진입 허용. URL 직접 호출 우회 차단용. */
  requireSysAdmin?: boolean;
  /** true 면 시스템관리자 또는 운영자(일반관리자)만 진입 허용. 일반 user 직접 API 호출 차단용. */
  requireOperatorOrAdmin?: boolean;
  /**
   * 지정 시 해당 URL param 의 사용자가 요청자와 같은 회사인지 검증 (시스템관리자는 우회).
   * 회사 격리가 필요한 단건 라우트(adminuser/[email]/*)의 정책을 핸들러 밖 한 곳에 선언.
   */
  scopeEmailParam?: string;
  /**
   * scopeEmailParam 과 함께 사용. 대상이 시스템관리자 계정이면 비-시스템관리자 요청자를 차단.
   * 회사 격리만으론 같은 회사 시스템관리자를 못 막으므로 write(PUT/DELETE)에서 추가 방어.
   */
  protectSysAdminTarget?: boolean;
}

export function withAuth(handler: AuthenticatedHandler, opts: WithAuthOptions = {}) {
  return async (request: NextRequest, props: any) => {
    const operation = "AUTH";

    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
      returnHeaders: true,
    });

    const session = sessionResponse?.response;

    if (!session || !session.user) {
      return createErrorResponse(
        {
          code: "AUTH",
          message: "Authentication required",
        },
        operation,
      );
    }

    const accessToken = sessionResponse?.headers?.get("set-auth-jwt") ?? undefined;
    const authorId = (session.session as any)?.authorId ?? null;
    const companyId = (session.session as any)?.companyId ?? null;

    // 기존 session 인터페이스 호환을 위해 accessToken 포함
    const sessionWithToken = {
      ...session,
      user: {
        ...session.user,
        authorId,
        companyId,
        isSysAdmin: authorId === SYS_ADMIN_AUTHOR_ID,
      },
      accessToken,
    };

    if (opts.requireSysAdmin && !sessionWithToken.user.isSysAdmin) {
      return createErrorResponse({ code: "FORBIDDEN", message: "권한이 없습니다." }, operation);
    }

    if (
      opts.requireOperatorOrAdmin &&
      !sessionWithToken.user.isSysAdmin &&
      sessionWithToken.user.authorId !== GENERAL_ADMIN_AUTHOR_ID
    ) {
      return createErrorResponse({ code: "FORBIDDEN", message: "권한이 없습니다." }, operation);
    }

    let unwrappedParams: any = {};
    if (props && props.params) {
      unwrappedParams = props.params instanceof Promise ? await props.params : props.params;
    }

    // 회사 격리 — 지정 param 의 사용자가 요청자 회사 소속인지 (시스템관리자 우회)
    if (opts.scopeEmailParam) {
      const email = unwrappedParams[opts.scopeEmailParam];
      const scopeMsg = await assertSameCompanyOrSysAdmin(sessionWithToken, email);
      if (scopeMsg) return createErrorResponse({ message: scopeMsg }, operation);

      // 대상이 시스템관리자 계정이면 비-시스템관리자 요청자 차단
      if (opts.protectSysAdminTarget && !sessionWithToken.user.isSysAdmin) {
        const protectMsg = await assertTargetNotSysAdmin(email);
        if (protectMsg) return createErrorResponse({ message: protectMsg }, operation);
      }
    }

    return await handler(request, sessionWithToken, unwrappedParams);
  };
}
