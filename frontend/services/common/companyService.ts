import { apiCall } from "@/utils/common/api/client";
import {
  CompanyOut,
  CompaniesOut,
  CompanyOptionsOut,
  CompanyCreateInSchema,
  CompanyUpdateInSchema,
  CompanyDomainsOut,
  CompanyDomainCreateInSchema,
  CompanyMenusOut,
  CompanyUsersOut,
} from "@/schemas/common/company";
import { CreateOut, UpdateOut, DeleteOut } from "@/schemas/common/types";
import { handleZodValidationError, validateWithZod } from "@/lib/zod/validation";

const BASE_URL = "/api/common/system/company";

// ==================== 회사 ====================

export const selectCompanyList = async (params: any): Promise<CompaniesOut | null> => {
  const queryParams: Record<string, any> = { ...params };
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);

  return apiCall<CompaniesOut>(BASE_URL, { method: "GET", params: queryParams });
};

export const selectCompany = async (data: any): Promise<CompanyOut | null> => {
  const { id } = data;
  return apiCall<CompanyOut>(`${BASE_URL}/${id}`, { method: "GET" });
};

export const createCompany = async (data: any): Promise<CreateOut | null> => {
  try {
    const validatedData = validateWithZod(CompanyCreateInSchema, data);
    return apiCall<CreateOut>(BASE_URL, { method: "POST", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const updateCompany = async (data: any): Promise<UpdateOut | null> => {
  try {
    const { id, ...baseData } = data;
    const validatedData = validateWithZod(CompanyUpdateInSchema, baseData);
    return apiCall<UpdateOut>(`${BASE_URL}/${id}`, {
      method: "PUT",
      data: validatedData,
    });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const selectCompanyOptions = async (): Promise<CompanyOptionsOut | null> =>
  apiCall<CompanyOptionsOut>(`${BASE_URL}/options`, { method: "GET" });

// ==================== 회사 도메인 ====================

export const selectCompanyDomainList = async (params: any): Promise<CompanyDomainsOut | null> => {
  const { company_id, ...rest } = params;
  const queryParams: Record<string, any> = { ...rest };
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);

  return apiCall<CompanyDomainsOut>(`${BASE_URL}/${company_id}/domain`, {
    method: "GET",
    params: queryParams,
  });
};

export const createCompanyDomain = async (data: any): Promise<CreateOut | null> => {
  try {
    const { company_id, ...baseData } = data;
    const validatedData = validateWithZod(CompanyDomainCreateInSchema, baseData);
    return apiCall<CreateOut>(`${BASE_URL}/${company_id}/domain`, {
      method: "POST",
      data: validatedData,
    });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const deleteCompanyDomain = async (data: any): Promise<DeleteOut | null> => {
  const { company_id, domain } = data;
  return apiCall<DeleteOut>(`${BASE_URL}/${company_id}/domain/${encodeURIComponent(domain)}`, {
    method: "DELETE",
  });
};

// ==================== 회사 메뉴 ====================

export const selectCompanyMenus = async (company_id: number): Promise<CompanyMenusOut | null> =>
  apiCall<CompanyMenusOut>(`${BASE_URL}/${company_id}/menu`, { method: "GET" });

export const addCompanyMenu = async (company_id: number, menu_id: string): Promise<CreateOut | null> =>
  apiCall<CreateOut>(`${BASE_URL}/${company_id}/menu`, {
    method: "POST",
    data: { menu_id },
  });

export const removeCompanyMenu = async (company_id: number, menu_id: string): Promise<DeleteOut | null> =>
  apiCall<DeleteOut>(`${BASE_URL}/${company_id}/menu/${menu_id}`, { method: "DELETE" });

// ==================== 회사 사용자 (read-only) ====================

export const selectCompanyUsers = async (params: any): Promise<CompanyUsersOut | null> => {
  const { company_id, ...rest } = params;
  const queryParams: Record<string, any> = { ...rest };
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);

  return apiCall<CompanyUsersOut>(`${BASE_URL}/${company_id}/user`, {
    method: "GET",
    params: queryParams,
  });
};
