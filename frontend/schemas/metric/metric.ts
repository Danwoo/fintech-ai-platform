// schemas/metric/metric.ts
import { TimeSeriesDataPoint } from "@/components/shared/Dashboard";

export interface MetricPoint extends TimeSeriesDataPoint {
  cpu_usage: number | null;
  memory_usage: number | null;
  request_rate: number | null;
  latency_ms: number | null;
}

export interface MetricHistoryOut {
  items: MetricPoint[];
  total_count: number;
}
