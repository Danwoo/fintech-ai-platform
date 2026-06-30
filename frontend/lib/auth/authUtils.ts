import { prisma } from "@/lib/prisma/client";
import { SYS_ADMIN_AUTHOR_ID } from "@/constants/protected";

export { hashPassword } from "better-auth/crypto";

/**
 * 사용자의 모든 활성 세션을 무효화한다.
 * - 회사/권한 변경 시 호출하여 stale 한 BaSession.companyId/authorId 가 다음 요청까지 살아남는 것을 방지.
 * - 대상 사용자는 다음 요청 시 재로그인이 필요해진다.
 */
export async function invalidateUserSessions(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;
  await prisma.baSession.deleteMany({ where: { userId: user.id } });
}

/**
 * 대상 사용자가 요청자와 같은 회사인지 검증 (시스템관리자는 무조건 통과).
 * 회사 격리가 필요한 라우트의 공통 가드 — null 이면 통과, 문자열이면 거부 메시지.
 * 존재 자체를 숨겨 타 회사 사용자 enumeration 을 막는다.
 */
export async function assertSameCompanyOrSysAdmin(session: any, email: string): Promise<string | null> {
  if (session.user.isSysAdmin) return null;
  // 비시스템관리자인데 회사가 없으면(미매핑 비정상) 아무도 접근 불가 — fail-closed (null==null 매칭 차단)
  if (session.user.companyId == null) return "사용자를 찾을 수 없습니다.";
  const target = await prisma.user.findUnique({
    where: { email },
    select: { company_id: true },
  });
  if (!target || target.company_id !== session.user.companyId) {
    return "사용자를 찾을 수 없습니다.";
  }
  return null;
}

/**
 * 대상 사용자가 시스템관리자 계정이면 거부 메시지 반환 (운영자가 시스템관리자 계정을 수정/삭제 못 하게).
 * 회사 격리만으론 같은 회사 시스템관리자를 막지 못하므로 별도 방어. null 이면 통과.
 */
export async function assertTargetNotSysAdmin(email: string): Promise<string | null> {
  const isSysAdmin = await prisma.authorMember.count({
    where: { author_id: SYS_ADMIN_AUTHOR_ID, user_id: email },
  });
  return isSysAdmin ? "시스템관리자 계정은 시스템관리자만 관리할 수 있습니다." : null;
}

/**
 * 대상 사용자가 시스템관리자(admin) 인지 + 시스템관리자 권한 제거/비활성 시 활성 시스템관리자가 0명이 되는지 검증.
 * - 시스템관리자가 아니면 항상 허용 (null 반환)
 * - 시스템관리자인데 활성 시스템관리자가 1명 이하라면 에러 메시지 반환
 */
export async function checkLastActiveSysAdmin(email: string): Promise<string | null> {
  const targetSysAdmin = await prisma.authorMember.findFirst({
    where: { author_id: SYS_ADMIN_AUTHOR_ID, user_id: email },
    include: { user: { select: { use_at: true, appr_at: true } } },
  });
  if (!targetSysAdmin) return null;
  // 대상이 현재 비활성 상태였다면 카운트에 안 포함되어 있으니 굳이 막을 필요 없음
  if (targetSysAdmin.user?.use_at !== "Y" || targetSysAdmin.user?.appr_at !== "Y") return null;

  const activeCount = await prisma.authorMember.count({
    where: { author_id: SYS_ADMIN_AUTHOR_ID, user: { use_at: "Y", appr_at: "Y" } },
  });
  if (activeCount <= 1) {
    return "시스템관리자 권한에는\n승인된 활성 사용자가 최소 1명 있어야 합니다.";
  }
  return null;
}
