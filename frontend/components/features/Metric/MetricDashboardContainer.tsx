"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TabPanel, TabContent } from "@/components/shared/ui";
import { TimeRangePanel, DataCards, TimeSeriesChart, DataLog } from "@/components/shared/Dashboard";
import type { CardConfig, ChartSeriesConfig } from "@/components/shared/Dashboard";
import { selectMetricHistory } from "@/services/metric/metricService";
import type { MetricPoint } from "@/schemas/metric/metric";

const POLL_INTERVAL = 5000;
const DEFAULT_MINUTES = 30;

const TAB_ITEMS = [
  { id: "chart", text: "차 트" },
  { id: "log", text: "로 그" },
];

const CARD_CONFIGS: CardConfig[] = [
  { key: "cpu_usage", label: "CPU 사용률", unit: "%", colorClass: "text-blue-600", decimals: 1 },
  { key: "memory_usage", label: "메모리 사용률", unit: "%", colorClass: "text-green-600", decimals: 1 },
  { key: "request_rate", label: "요청 처리율", unit: "req/s", colorClass: "text-orange-500", decimals: 1 },
  { key: "latency_ms", label: "평균 지연시간", unit: "ms", colorClass: "text-purple-600", decimals: 1 },
];

const CHART_SERIES: ChartSeriesConfig[] = [
  {
    key: "cpu_usage",
    name: "CPU 사용률",
    color: "#3b82f6",
    unit: "%",
    yAxisName: "%",
    decimals: 1,
    limits: { upl: 90, lpl: 10 },
  },
  { key: "memory_usage", name: "메모리 사용률", color: "#10b981", unit: "%", yAxisName: "%", decimals: 1 },
  { key: "request_rate", name: "요청 처리율", color: "#f97316", unit: "req/s", yAxisName: "req/s", decimals: 1 },
  { key: "latency_ms", name: "평균 지연시간", color: "#9333ea", unit: "ms", yAxisName: "ms", decimals: 1 },
];

export default function MetricDashboardContainer() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [isPolling, setIsPolling] = useState(true);
  const [data, setData] = useState<MetricPoint[]>([]);
  const minutesRef = useRef(minutes);
  minutesRef.current = minutes;

  const fetchHistory = useCallback(async (mins: number) => {
    const result = await selectMetricHistory(mins);
    if (result) setData(result.items);
  }, []);

  useEffect(() => {
    fetchHistory(minutes);
  }, [fetchHistory, minutes]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(() => fetchHistory(minutesRef.current), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isPolling, fetchHistory]);

  const applyMinutes = useCallback(() => fetchHistory(minutesRef.current), [fetchHistory]);
  const toggleActive = useCallback(() => setIsPolling((p) => !p), []);

  const latest = data.length ? data[data.length - 1] : null;

  return (
    <div className="h-full max-h-screen flex flex-col p-4">
      <TimeRangePanel
        minutes={minutes}
        setMinutes={setMinutes}
        applyMinutes={applyMinutes}
        isActive={isPolling}
        toggleActive={toggleActive}
      />

      <DataCards data={latest} cardConfigs={CARD_CONFIGS} connected={isPolling} showConnectionStatus />

      <TabPanel items={TAB_ITEMS} defaultTab="chart">
        <TabContent tabId="chart" className="flex flex-col h-full overflow-hidden">
          <TimeSeriesChart
            data={data}
            seriesConfigs={CHART_SERIES}
            title="시스템 메트릭 차트"
            isActive={isPolling}
            onActiveChange={setIsPolling}
            options={{ initialVisibleHours: minutes / 60, xAxisLabelRotate: 45 }}
          />
        </TabContent>
        <TabContent tabId="log" className="flex flex-col h-full overflow-auto">
          <DataLog data={data} cardConfigs={CARD_CONFIGS} title="시스템 메트릭 로그" />
        </TabContent>
      </TabPanel>
    </div>
  );
}
