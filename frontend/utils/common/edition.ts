// utils/common/edition.ts
import { env } from "@/env";

/**
 * 제품 에디션 헬퍼 — NEXT_PUBLIC_APP_EDITION 단일 소스.
 *
 * - SAAS: 멀티테넌트. 이메일 도메인 매핑으로 회사 자동 배정 + 즉시 활성.
 * - OEM: 단일 회사 배포. 셀프 가입은 DB 의 유일 활성 회사로 배정되며 항상 승인 대기.
 *
 * 원칙: 이 헬퍼는 "경계" (가입 진입점, 폼 노출) 에서만 호출한다.
 *       공유 훅/컴포넌트/nav 로직 안에는 넣지 않는다 (에디션 비의존 유지).
 */
export const isOEM = () => env.NEXT_PUBLIC_APP_EDITION === "OEM";
export const isSaaS = () => !isOEM();
