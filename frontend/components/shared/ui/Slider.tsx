// components/shared/ui/Slider.tsx
import DevSlider from "devextreme-react/slider";

interface Props<T = any> {
  fieldName: keyof T;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  showRange?: boolean;
  tooltip?: {
    enabled: boolean;
    format?: string; // 값 표시 형식 (예: '{0}%', '{0}원')
    position?: "top" | "bottom";
  };
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 슬라이더 입력 컴포넌트
 *
 * 숫자 범위 내에서 값을 선택할 때 사용합니다.
 * 연봉, 점수, 진행률, 우선순위 등의 입력에 적합합니다.
 *
 * @example
 * <Slider
 *   fieldName="salary"
 *   min={2000}
 *   max={10000}
 *   step={100}
 *   tooltip={{ enabled: true, format: '{0}만원' }}
 * />
 */
export function Slider<T = any>({
  fieldName,
  value,
  min = 0,
  max = 100,
  step = 1,
  readOnly = false,
  showRange = true,
  tooltip = { enabled: true },
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevSlider
      value={value || min}
      min={min}
      max={max}
      step={step}
      readOnly={readOnly}
      showRange={showRange}
      tooltip={tooltip}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
