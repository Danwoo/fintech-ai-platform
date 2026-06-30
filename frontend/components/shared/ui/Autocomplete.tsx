// components/shared/ui/Autocomplete.tsx
import DevAutocomplete from "devextreme-react/autocomplete";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string;
  items: any[];
  displayExpr?: string; // 표시 필드명 (기본: 'code_nm')
  valueExpr?: string; // 값 필드명 (기본: 'code')
  placeholder?: string;
  readOnly?: boolean;
  minSearchLength?: number; // 검색 시작 최소 문자 수
  searchTimeout?: number; // 검색 지연 시간(ms)
  showClearButton?: boolean;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 자동완성 입력 컴포넌트
 *
 * 입력하는 동안 관련 제안을 표시하는 컴포넌트입니다.
 * 사용자명, 회사명, 주소 등 기존 데이터에서 선택할 때 사용합니다.
 *
 * @example
 * <Autocomplete
 *   fieldName="assignee"
 *   items={userList}
 *   displayExpr="name"
 *   valueExpr="id"
 *   placeholder="담당자 검색"
 * />
 */
export function Autocomplete<T = any>({
  fieldName,
  value,
  items,
  displayExpr = "code_nm",
  valueExpr = "code",
  placeholder,
  readOnly = false,
  minSearchLength = 1,
  searchTimeout = 200,
  showClearButton = true,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevAutocomplete
      items={items}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      value={value || ""}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      minSearchLength={minSearchLength}
      searchTimeout={searchTimeout}
      showClearButton={showClearButton && !readOnly}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
