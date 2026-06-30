// components/shared/ui/Lookup.tsx
import DevLookup from "devextreme-react/lookup";
import { PAGE_SIZE } from "@/constants/app";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string | number;
  dataSource: any; // 배열, DataSource, Store
  displayExpr?: string; // 표시 필드명 (기본: 'code_nm')
  valueExpr?: string; // 값 필드명 (기본: 'code')
  placeholder?: string;
  readOnly?: boolean;
  searchEnabled?: boolean;
  searchMode?: "contains" | "startswith";
  searchExpr?: string | string[];
  minSearchLength?: number; // 검색 시작 최소 문자 수
  showDataBeforeSearch?: boolean;
  pageSize?: number;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 룩업 선택 컴포넌트
 *
 * 대용량 데이터에서 항목을 검색하고 선택할 때 사용합니다.
 * 페이징, 검색, 필터링 기능을 내장하여 많은 데이터를 효율적으로 처리합니다.
 *
 * @example
 * <Lookup
 *   fieldName="customer"
 *   dataSource={customerDataSource}
 *   displayExpr="companyName"
 *   searchExpr={['companyName', 'businessNumber']}
 * />
 */
export function Lookup<T = any>({
  fieldName,
  value,
  dataSource,
  displayExpr = "code_nm",
  valueExpr = "code",
  placeholder,
  readOnly = false,
  searchEnabled = true,
  searchMode = "contains",
  searchExpr,
  minSearchLength = 0,
  showDataBeforeSearch = true,
  pageSize = PAGE_SIZE.LOOKUP,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevLookup
      dataSource={dataSource}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      value={value === "" ? null : (value ?? null)}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      searchEnabled={searchEnabled}
      searchMode={searchMode}
      searchExpr={searchExpr || displayExpr}
      minSearchLength={minSearchLength}
      showDataBeforeSearch={showDataBeforeSearch}
      pageSize={pageSize}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
