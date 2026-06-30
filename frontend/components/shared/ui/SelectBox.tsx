// components/shared/ui/SelectBox.tsx
import React from "react";
import DevSelectBox from "devextreme-react/select-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string | number | null;
  items: any[];
  displayExpr?: string;
  valueExpr?: string;
  placeholder?: string;
  readOnly?: boolean;
  searchEnabled?: boolean;
  noDataText?: string;
  showClearButton?: boolean;
  acceptCustomValue?: boolean;
  width?: number | string;
  height?: number | string;
  disabled?: boolean;
  itemRender?: (item: any) => React.ReactNode;
  fieldRender?: (item: any) => React.ReactNode;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 단일 선택 드롭다운
 *
 * - 객체 배열: displayExpr(기본 "code_nm"), valueExpr(기본 "code") 사용
 * - 문자열 배열: displayExpr/valueExpr 무시하고 값 그대로 사용
 * - acceptCustomValue: 목록에 없는 값 직접 입력 허용
 */
export function SelectBox<T = any>({
  fieldName,
  value,
  items,
  displayExpr = "code_nm",
  valueExpr = "code",
  placeholder = "-- 선택 --",
  readOnly = false,
  searchEnabled = false,
  noDataText,
  showClearButton,
  acceptCustomValue = false,
  width,
  height,
  disabled,
  itemRender,
  fieldRender,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const isStringArray = items.length > 0 && typeof items[0] === "string";
  const finalDisplayExpr = isStringArray ? undefined : displayExpr;
  const finalValueExpr = isStringArray ? undefined : valueExpr;

  return (
    <DevSelectBox
      items={items}
      displayExpr={finalDisplayExpr}
      valueExpr={finalValueExpr}
      value={value === "" ? null : (value ?? null)}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      searchEnabled={searchEnabled || acceptCustomValue}
      noDataText={noDataText}
      showClearButton={showClearButton ?? !readOnly}
      acceptCustomValue={acceptCustomValue}
      onCustomItemCreating={
        acceptCustomValue
          ? (e: any) => {
              if (e.text) e.customItem = e.text;
            }
          : undefined
      }
      width={width}
      height={height}
      disabled={disabled}
      itemRender={itemRender}
      fieldRender={fieldRender}
      onValueChanged={(e: any) => onValueChanged(fieldName, e.value)}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
