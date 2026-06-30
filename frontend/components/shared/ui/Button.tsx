// components/shared/ui/Button.tsx
import React from "react";
import DevButton from "devextreme-react/button";

export interface Props {
  text?: string;
  onClick?: () => void;
  type?: "default" | "success" | "normal" | "danger";
  stylingMode?: "contained" | "outlined" | "text";
  icon?: string;
  width?: number | string;
  height?: number | string;
  disabled?: boolean;
  visible?: boolean;
  className?: string;
  style?: React.CSSProperties;
  useSubmitBehavior?: boolean;
  render?: () => React.ReactNode;
  hint?: string;
  elementAttr?: Record<string, any>;
}

/** ButtonProps에 sort를 더한 액션 버튼 타입. 패널/훅 내부 순서 제어에만 사용됩니다. */
export type ActionButton = Props & { sort?: number };

/**
 * DevExtreme Button 래핑 컴포넌트
 *
 * DevExtreme Button의 모든 기능을 지원하면서
 * width/height props와 style 병합, 조건부 렌더링을 제공합니다.
 *
 * @example
 * <Button text="저장" type="success" onClick={handleSave} />
 */
export const Button: React.FC<Props> = ({
  text,
  onClick,
  type = "default",
  stylingMode = "contained",
  icon,
  width,
  height,
  disabled = false,
  visible = true,
  className,
  style,
  useSubmitBehavior = false,
  render,
  hint,
  ...rest
}) => {
  if (!visible) return null;

  const combinedStyle: React.CSSProperties = {
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <DevButton
      text={text}
      icon={icon}
      type={type}
      stylingMode={stylingMode}
      onClick={onClick}
      disabled={disabled}
      useSubmitBehavior={useSubmitBehavior}
      className={className}
      hint={hint}
      style={combinedStyle}
      render={render}
      {...rest}
    />
  );
};

export default Button;
