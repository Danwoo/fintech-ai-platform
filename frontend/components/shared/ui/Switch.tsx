// components/shared/ui/Switch.tsx
import DevSwitch from "devextreme-react/switch";

type SwitchColor = "green" | "red" | "blue" | "gray" | "yellow";
type SwitchShape = "rounded" | "square";

interface Props<T = any> {
  fieldName: keyof T;
  value?: boolean;
  readOnly?: boolean;
  switchedOnText?: string; // ON 상태 텍스트 (기본: 'ON')
  switchedOffText?: string; // OFF 상태 텍스트 (기본: 'OFF')
  color?: SwitchColor; // ON 상태 색상 (기본: 'green')
  shape?: SwitchShape; // 트랙/핸들 모양 (기본: 'rounded')
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 스위치 토글 컴포넌트
 *
 * 참/거짓, 활성/비활성, 사용/미사용 등 boolean 값 입력에 사용합니다.
 * 체크박스보다 시각적으로 명확하며 모바일 친화적입니다.
 *
 * @example
 * <Switch
 *   fieldName="emailNotification"
 *   switchedOnText="수신"
 *   switchedOffText="차단"
 * />
 */
export function Switch<T = any>({
  fieldName,
  value,
  readOnly = false,
  switchedOnText = "",
  switchedOffText = "",
  color = "green",
  shape = "rounded",
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevSwitch
      value={value || false}
      readOnly={readOnly}
      switchedOnText={switchedOnText}
      switchedOffText={switchedOffText}
      elementAttr={{ class: `switch-${color} switch-${shape}` }}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
