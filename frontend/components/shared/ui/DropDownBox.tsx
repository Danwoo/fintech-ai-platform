// components/shared/ui/DropDownBox.tsx
import { ReactNode } from "react";
import DevDropDownBox from "devextreme-react/drop-down-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: any;
  placeholder?: string;
  readOnly?: boolean;
  displayExpr?: string;
  valueExpr?: string;
  showClearButton?: boolean;
  dropDownOptions?: {
    width?: number | string;
    height?: number | string;
    showTitle?: boolean;
  };
  contentRender?: () => ReactNode;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 커스텀 드롭다운 박스 컴포넌트
 *
 * 일반적인 SelectBox로는 구현하기 어려운 복잡한 선택 UI를 만들 때 사용합니다.
 * 트리 구조, 그리드, 차트 등 커스텀 컨텐츠를 드롭다운에 표시할 수 있습니다.
 *
 * @example
 * <DropDownBox
 *   fieldName="category"
 *   contentRender={() => <CustomCategoryTree />}
 *   dropDownOptions={{ width: 400, height: 300 }}
 * />
 */
export function DropDownBox<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  displayExpr,
  valueExpr,
  showClearButton = true,
  dropDownOptions = { width: 300, height: 200 },
  contentRender,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevDropDownBox
      value={value === "" ? null : (value ?? null)}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      showClearButton={showClearButton && !readOnly}
      dropDownOptions={dropDownOptions}
      contentRender={contentRender}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
