// components/shared/ui/TextArea.tsx
import DevTextArea from "devextreme-react/text-area";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  width?: number | string;
  height?: number | string; // 텍스트 영역 높이 (px 또는 "100%" 등 — flex 채우기 시)
  maxLength?: number;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 다중 라인 텍스트 입력 컴포넌트
 *
 * 긴 텍스트나 여러 줄 입력이 필요한 경우 사용합니다.
 * 비고, 설명, 메모 등의 입력에 적합합니다.
 *
 * @example
 * <TextArea
 *   fieldName="memo"
 *   height={120}
 *   maxLength={500}
 *   placeholder="메모 (최대 500자)"
 * />
 */
export function TextArea<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  width,
  height = 80,
  maxLength,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevTextArea
      value={value || ""}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      width={width}
      height={height}
      maxLength={maxLength}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
