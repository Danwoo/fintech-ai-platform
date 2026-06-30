/**
 * 공통 Dashboard 컴포넌트를 위한 타입 정의
 */

// 시계열 데이터의 기본 구조
export interface TimeSeriesDataPoint {
  timestamp: string;
  [key: string]: string | number | boolean | null | undefined;
}

// 차트 시리즈 설정
export interface ChartSeriesConfig {
  key: string; // 데이터 키
  name: string; // 표시 이름
  color: string; // 색상
  unit: string; // 단위
  yAxisName: string; // Y축 이름
  decimals?: number; // 소수점 자릿수
  axisLabelDecimals?: number; // Y축 라벨 소수점 자릿수
  limits?: {
    upl: number; // Upper Process Limit
    lpl: number; // Lower Process Limit
  };
}

// 카드 설정
export interface CardConfig {
  key: string; // 데이터 키
  label: string; // 표시 라벨
  unit: string; // 단위
  colorClass: string; // Tailwind CSS 색상 클래스
  decimals?: number; // 소수점 자릿수
  bgClass?: string; // 배경 색상 클래스
}

// 시간 범위 프리셋
export interface TimeRangePreset {
  label: string;
  minutes: number; // 0이면 직접 입력 모드
}

// 차트 옵션
export interface ChartOptions {
  height?: number | string;
  initialVisibleHours?: number;
  animationEnabled?: boolean;
  showSymbol?: boolean;
  tooltipHeaderFormatter?: (axisValue: number) => string;
  xAxisLabelRotate?: number;
  xAxisLabelFormatter?: string | ((value: number) => string);
  xAxisMaxInterval?: number;
  xAxisMin?: number;
  xAxisMax?: number;
  xAxisType?: "time" | "value";
  renderer?: "canvas" | "svg";
}

// 로그 옵션
export interface LogOptions {
  height?: number | string;
  reverseOrder?: boolean; // 최신 데이터를 위에 표시
}
