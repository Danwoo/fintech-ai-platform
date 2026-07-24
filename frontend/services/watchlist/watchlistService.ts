import { CreateOut, UpdateOut, DeleteOut } from "@/schemas/common/types";
import {
  WatchlistCreateInSchema,
  WatchlistUpdateInSchema,
  WatchlistsOut,
  WatchlistOut,
} from "@/schemas/watchlist/watchlist";
import { apiCall } from "@/utils/common/api/client";
import { handleZodValidationError, validateWithZod } from "@/lib/zod/validation";

// 프론트 프록시 경로(#146 컨벤션) → 백엔드 prefix "/watchlist"
const BASE_URL = "/api/external/backend/watchlist";

const stringifyGridParams = (params: any): Record<string, any> => {
  const queryParams: Record<string, any> = { ...params };
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);
  return queryParams;
};

// 관심종목 목록 조회
export const selectWatchlistList = async (params: any): Promise<WatchlistsOut | null> => {
  return apiCall<WatchlistsOut>(BASE_URL, { method: "GET", params: stringifyGridParams(params) });
};

// 관심종목 단건 조회
export const selectWatchlist = async (data: any): Promise<WatchlistOut | null> => {
  return apiCall<WatchlistOut>(`${BASE_URL}/${data.ticker}`, { method: "GET" });
};

// 관심종목 등록
export const createWatchlist = async (data: any): Promise<CreateOut | null> => {
  try {
    const validatedData = validateWithZod(WatchlistCreateInSchema, data);
    return apiCall<CreateOut>(BASE_URL, { method: "POST", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

// 관심종목 수정
export const updateWatchlist = async (data: any): Promise<UpdateOut | null> => {
  try {
    const { ticker, ...baseData } = data;
    const validatedData = validateWithZod(WatchlistUpdateInSchema, baseData);
    return apiCall<UpdateOut>(`${BASE_URL}/${ticker}`, { method: "PUT", data: validatedData });
  } catch (error) {
    handleZodValidationError(error);
  }
};

// 관심종목 삭제
export const deleteWatchlist = async (data: any): Promise<DeleteOut | null> => {
  return apiCall<DeleteOut>(`${BASE_URL}/${data.ticker}`, { method: "DELETE" });
};
