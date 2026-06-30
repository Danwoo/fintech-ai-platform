import { CreateOut, UpdateOut, DeleteOut } from "@/schemas/common/types";
import {
  CategoryCreateInSchema,
  CategoryUpdateInSchema,
  CategoriesOut,
  CategoryOut,
  ProductCreateInSchema,
  ProductUpdateInSchema,
  ProductsOut,
} from "@/schemas/category/category";
import { apiCall } from "@/utils/common/api/client";
import { handleZodValidationError, validateWithZod } from "@/lib/zod/validation";

const BASE_URL = "/api/external/category";

const stringifyGridParams = (params: any): Record<string, any> => {
  const queryParams: Record<string, any> = { ...params };
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);
  return queryParams;
};

// ── Category (master) ──────────────────────────────────────────────────
export const selectCategoryList = async (params: any): Promise<CategoriesOut | null> => {
  return apiCall<CategoriesOut>(BASE_URL, { method: "GET", params: stringifyGridParams(params) });
};

export const selectCategory = async (data: any): Promise<CategoryOut | null> => {
  return apiCall<CategoryOut>(`${BASE_URL}/${data.category_id}`, { method: "GET" });
};

export const createCategory = async (data: any): Promise<CreateOut | null> => {
  try {
    const validatedData = validateWithZod(CategoryCreateInSchema, data);
    return apiCall<CreateOut>(BASE_URL, { method: "POST", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const updateCategory = async (data: any): Promise<UpdateOut | null> => {
  try {
    const { category_id, ...baseData } = data;
    const validatedData = validateWithZod(CategoryUpdateInSchema, baseData);
    return apiCall<UpdateOut>(`${BASE_URL}/${category_id}`, { method: "PUT", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const deleteCategory = async (data: any): Promise<DeleteOut | null> => {
  return apiCall<DeleteOut>(`${BASE_URL}/${data.category_id}`, { method: "DELETE" });
};

// ── Product (detail) ───────────────────────────────────────────────────
export const selectProductList = async (params: any): Promise<ProductsOut | null> => {
  const { category_id, ...rest } = params;
  return apiCall<ProductsOut>(`${BASE_URL}/${category_id}/product`, {
    method: "GET",
    params: stringifyGridParams(rest),
  });
};

export const createProduct = async (data: any): Promise<CreateOut | null> => {
  try {
    const { category_id, ...baseData } = data;
    const validatedData = validateWithZod(ProductCreateInSchema, baseData);
    return apiCall<CreateOut>(`${BASE_URL}/${category_id}/product`, { method: "POST", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const updateProduct = async (data: any): Promise<UpdateOut | null> => {
  try {
    const { category_id, product_id, ...baseData } = data;
    const validatedData = validateWithZod(ProductUpdateInSchema, baseData);
    return apiCall<UpdateOut>(`${BASE_URL}/${category_id}/product/${product_id}`, {
      method: "PUT",
      data: validatedData,
    });
  } catch (error) {
    handleZodValidationError(error);
  }
};

export const deleteProduct = async (data: any): Promise<DeleteOut | null> => {
  return apiCall<DeleteOut>(`${BASE_URL}/${data.category_id}/product/${data.product_id}`, { method: "DELETE" });
};
