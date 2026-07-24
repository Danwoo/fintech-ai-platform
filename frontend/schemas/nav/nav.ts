// schemas/nav/nav.ts
import { TimeSeriesDataPoint } from "@/components/shared/Dashboard";

export interface NavPoint extends TimeSeriesDataPoint {
  nav: number | null;
  benchmark: number | null;
  daily_return: number | null;
  drawdown: number | null;
}

export interface NavHistoryOut {
  items: NavPoint[];
  total_count: number;
}
