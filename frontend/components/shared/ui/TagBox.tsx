// components/shared/ui/TagBox.tsx
import DevTagBox from "devextreme-react/tag-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string[] | number[];
  items: any[];
  displayExpr?: string;
  valueExpr?: string;
  placeholder?: string;
  readOnly?: boolean;
  searchEnabled?: boolean;
  noDataText?: string;
  maxDisplayedTags?: number;
  showClearButton?: boolean;
  acceptCustomValue?: boolean;
  showSelectionControls?: boolean;
  width?: number | string;
  height?: number | string;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 다중 선택 태그 박스
 *
 * - 객체 배열: displayExpr(기본 "code_nm"), valueExpr(기본 "code") 사용
 * - 문자열 배열: displayExpr/valueExpr 무시하고 값 그대로 사용
 * - acceptCustomValue: 목록에 없는 값 직접 입력 허용 (문자열 배열이면 string, 객체 배열이면 {valueExpr, displayExpr} 형태로 추가)
 */
export function TagBox<T = any>({
  fieldName,
  value = [],
  items,
  displayExpr = "code_nm",
  valueExpr = "code",
  placeholder = "선택하세요",
  readOnly = false,
  searchEnabled = true,
  noDataText,
  maxDisplayedTags,
  showClearButton,
  acceptCustomValue = false,
  showSelectionControls = false,
  width,
  height,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const isStringArray =
    (items.length > 0 && typeof items[0] === "string") ||
    (items.length === 0 && Array.isArray(value) && value.length > 0 && typeof (value as any[])[0] === "string");
  const finalDisplayExpr = isStringArray ? undefined : displayExpr;
  const finalValueExpr = isStringArray ? undefined : valueExpr;

  const handleCustomItemCreating = (e: any) => {
    if (!e.text) return;
    e.customItem = isStringArray ? e.text : { [valueExpr]: e.text, [displayExpr]: e.text };
  };

  return (
    <DevTagBox
      items={items}
      displayExpr={finalDisplayExpr}
      valueExpr={finalValueExpr}
      value={value}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      searchEnabled={searchEnabled}
      noDataText={noDataText}
      maxDisplayedTags={maxDisplayedTags}
      showClearButton={showClearButton ?? !readOnly}
      acceptCustomValue={acceptCustomValue}
      showSelectionControls={showSelectionControls}
      onCustomItemCreating={acceptCustomValue ? handleCustomItemCreating : undefined}
      width={width}
      height={height}
      onValueChanged={(e: any) => onValueChanged(fieldName, e.value)}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
