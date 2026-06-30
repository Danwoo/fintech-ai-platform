// components/shared/ui/RadioGroup.tsx
import DevRadioGroup from "devextreme-react/radio-group";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string | number;
  items: any[];
  displayExpr?: string; // 표시 필드명 (기본: 'code_nm')
  valueExpr?: string; // 값 필드명 (기본: 'code')
  layout?: "horizontal" | "vertical";
  readOnly?: boolean;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 라디오 그룹 컴포넌트
 *
 * 여러 옵션 중 하나만 선택할 때 사용합니다.
 * 옵션이 적고(2-5개) 모든 선택지를 한눈에 보여주고 싶을 때 적합합니다.
 *
 * @example
 * <RadioGroup
 *   fieldName="priority"
 *   items={priorityOptions}
 *   displayExpr="label"
 *   valueExpr="value"
 *   layout="vertical"
 * />
 */
export function RadioGroup<T = any>({
  fieldName,
  value,
  items,
  displayExpr = "code_nm",
  valueExpr = "code",
  layout = "horizontal",
  readOnly = false,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevRadioGroup
      items={items}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      value={value === "" ? null : (value ?? null)}
      layout={layout}
      readOnly={readOnly}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
