// components/shared/ui/Calendar.tsx
import { ReactNode } from "react";
import DevCalendar from "devextreme-react/calendar";

interface Props<T = any> {
  fieldName: keyof T;
  value?: Date | string;
  readOnly?: boolean;
  min?: Date | string;
  max?: Date | string;
  firstDayOfWeek?: number; // 0: 일요일, 1: 월요일
  showTodayButton?: boolean;
  zoomLevel?: "month" | "year" | "decade" | "century";
  cellTemplate?: (cellData: any) => ReactNode;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 달력 컴포넌트
 *
 * 달력 형태로 날짜를 선택할 때 사용합니다.
 * DateBox보다 시각적으로 더 명확하며, 월 단위 선택에 유용합니다.
 *
 * @example
 * <Calendar fieldName="eventDate" min={new Date()} showTodayButton />
 */
export function Calendar<T = any>({
  fieldName,
  value,
  readOnly = false,
  min,
  max,
  firstDayOfWeek = 0,
  showTodayButton = true,
  zoomLevel = "month",
  cellTemplate,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChange = (e: any) => {
    const dateValue = e.value ? e.value.toISOString().split("T")[0] : null;
    onValueChanged(fieldName, dateValue);
  };

  return (
    <DevCalendar
      value={value}
      readOnly={readOnly}
      min={min}
      max={max}
      firstDayOfWeek={firstDayOfWeek}
      showTodayButton={showTodayButton}
      zoomLevel={zoomLevel}
      cellTemplate={cellTemplate}
      onValueChanged={handleValueChange}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
