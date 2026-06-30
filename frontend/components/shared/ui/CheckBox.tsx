// components/shared/ui/CheckBox.tsx
import DevCheckBox from "devextreme-react/check-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: boolean;
  text?: string;
  readOnly?: boolean;
  iconSize?: number;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 체크박스 컴포넌트
 *
 * 동의/비동의, 선택/비선택 등 boolean 값 입력에 사용합니다.
 * 단일 옵션의 참/거짓을 선택할 때 적합합니다.
 *
 * @example
 * <CheckBox fieldName="isAgreed" text="개인정보 처리방침에 동의합니다" />
 */
export function CheckBox<T = any>({
  fieldName,
  value,
  text,
  readOnly = false,
  iconSize,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevCheckBox
      value={value || false}
      text={text}
      readOnly={readOnly}
      iconSize={iconSize}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
