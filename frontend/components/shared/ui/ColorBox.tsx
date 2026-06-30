// components/shared/ui/ColorBox.tsx
import DevColorBox from "devextreme-react/color-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string; // HEX, RGB, RGBA 형식
  placeholder?: string;
  readOnly?: boolean;
  editAlphaChannel?: boolean;
  applyButtonText?: string;
  cancelButtonText?: string;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 색상 선택 컴포넌트
 *
 * 테마 색상, 배경색, 텍스트 색상 등을 선택할 때 사용합니다.
 * 색상 팔레트를 제공하며 RGB, HEX, RGBA 형식을 모두 지원합니다.
 *
 * @example
 * <ColorBox fieldName="themeColor" editAlphaChannel placeholder="테마 색상 선택" />
 */
export function ColorBox<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  editAlphaChannel = false,
  applyButtonText = "확인",
  cancelButtonText = "취소",
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevColorBox
      value={value || ""}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      editAlphaChannel={editAlphaChannel}
      applyButtonText={applyButtonText}
      cancelButtonText={cancelButtonText}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
