// schemas/common/company.ts
import { z } from "zod";
import { CommonEntity } from "@/schemas/common/types";
import { domain, enums, Field, int, StrRange, object } from "@/lib/zod/helpers";

// ==================== 회사 ====================

const NO_WHITESPACE = /^\S+$/;

export const CompanySchema = object({
  id: int(),
  company_code: Field({ min_length: 1, max_length: 30, pattern: NO_WHITESPACE }).str(),
  company_nm: StrRange(1, 200),
  use_at: enums(["Y", "N"]),
});

export const CompanyCreateInSchema = CompanySchema.omit({ id: true });
export const CompanyUpdateInSchema = CompanySchema.omit({ id: true, company_code: true });

export type Company = z.infer<typeof CompanySchema>;
export type CompanyOut = Company & CommonEntity;
export interface CompaniesOut {
  items: CompanyOut[];
  total_count: number;
}

export interface CompanyOptionOut {
  id: number;
  company_code: string;
  company_nm: string;
}
export interface CompanyOptionsOut {
  items: CompanyOptionOut[];
  total_count: number;
}

// ==================== 회사 도메인 ====================

export const CompanyDomainSchema = object({
  company_id: int(),
  domain: domain(100),
});

export const CompanyDomainCreateInSchema = CompanyDomainSchema.omit({ company_id: true });

export type CompanyDomain = z.infer<typeof CompanyDomainSchema>;
export type CompanyDomainOut = CompanyDomain & CommonEntity & { company_nm?: string };
export interface CompanyDomainsOut {
  items: CompanyDomainOut[];
  total_count: number;
}

// ==================== 회사 메뉴 ====================

export interface CompanyMenuItem {
  menu_id: string;
  menu_nm: string;
  menu_level: number;
  use_at: string | null;
}

export interface CompanyMenusOut {
  companyMenus: { menu_id: string; reg_dt: string | null; menu?: { menu_nm: string; use_at: string | null } }[];
  allMenus: CompanyMenuItem[];
}

// ==================== 회사 사용자 (read-only) ====================

export interface CompanyUserOut {
  rn: number;
  email: string;
  name: string | null;
  dept: string | null;
  use_at: string;
  appr_at: string;
  reg_dt: string;
  author_nm: string;
}

export interface CompanyUsersOut {
  items: CompanyUserOut[];
  total_count: number;
}
