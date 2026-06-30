// components/shared/ui/RangeSlider.tsx
import DevRangeSlider from "devextreme-react/range-slider";

interface Props<T = any> {
  fieldName: keyof T;
  value?: [number, number]; // 범위 값 [시작, 끝]
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  showRange?: boolean;
  tooltip?: {
    enabled: boolean;
    position?: "top" | "bottom";
    format?: string;
    showMode?: "onHover" | "always";
  };
  label?: {
    visible: boolean;
    position?: "top" | "bottom";
    format?: string;
  };
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 범위 슬라이더 컴포넌트
 *
 * 최솟값과 최댓값을 가진 범위를 선택할 때 사용합니다.
 * 가격 범위, 연령대, 점수 범위 등의 입력에 적합합니다.
 *
 * @example
 * <RangeSlider
 *   fieldName="priceRange"
 *   min={0}
 *   max={1000000}
 *   step={10000}
 *   tooltip={{ enabled: true, format: '{0:c0}' }}
 * />
 */
export function RangeSlider<T = any>({
  fieldName,
  value,
  min = 0,
  max = 100,
  step = 1,
  readOnly = false,
  showRange = true,
  tooltip = { enabled: true },
  label = { visible: false },
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, [e.start, e.end]);
  };

  return (
    <DevRangeSlider
      start={value?.[0] || min}
      end={value?.[1] || max}
      min={min}
      max={max}
      step={step}
      readOnly={readOnly}
      showRange={showRange}
      tooltip={tooltip}
      label={label}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
