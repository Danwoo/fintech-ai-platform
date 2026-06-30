import { MetricHistoryOut } from "@/schemas/metric/metric";
import { apiCall } from "@/utils/common/api/client";

const BASE_URL = "/api/external/metric";

/**
 * 메트릭 시계열 이력 조회 (대시보드 차트/카드/로그용)
 */
export const selectMetricHistory = async (minutes: number): Promise<MetricHistoryOut | null> => {
  return apiCall<MetricHistoryOut>(`${BASE_URL}/history`, {
    method: "GET",
    params: { minutes },
  });
};
