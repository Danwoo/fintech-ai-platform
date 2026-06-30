// components/shared/ui/NumberBox.tsx
import DevNumberBox from "devextreme-react/number-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: number | null;
  placeholder?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number; // 증감 단위 (기본: 1)
  format?: string; // 숫자 표시 형식 (예: '#,##0원')
  showSpinButtons?: boolean;
  visible?: boolean; // 컴포넌트 표시 여부
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
  width?: number | string;
  height?: number | string;
  disabled?: boolean;
  tabIndex?: number;
}

/**
 * 숫자 입력 컴포넌트
 *
 * 나이, 연봉, 수량, 금액 등 숫자 값 입력에 사용합니다.
 * 자동으로 숫자 형식을 적용하고 유효성을 검증합니다.
 *
 * @example
 * <NumberBox
 *   fieldName="salary"
 *   min={0}
 *   format="#,##0원"
 *   showSpinButtons
 * />
 *
 * // 숨김 처리 예시
 * <NumberBox
 *   fieldName="hidden_id"
 *   value={selectedId}
 *   visible={false}
 * />
 */
export function NumberBox<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  min,
  max,
  step = 1,
  format,
  showSpinButtons = false,
  visible = true,
  onValueChanged,
  getFieldProps,
  width,
  height,
  disabled,
  tabIndex,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevNumberBox
      value={value !== null && value !== undefined ? value : undefined}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      format={format}
      showSpinButtons={showSpinButtons}
      visible={visible}
      width={width}
      height={height}
      disabled={disabled}
      tabIndex={tabIndex}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
