// components/shared/ui/TextBox.tsx
"use client";

import { useState } from "react";
import DevTextBox from "devextreme-react/text-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string | number | null;
  placeholder?: string;
  readOnly?: boolean;
  mode?: "text" | "search" | "tel" | "url" | "email" | "password";
  showPasswordToggle?: boolean;
  mask?: string; // 마스크 패턴 (예: '000-0000-0000')
  maskChar?: string;
  maskInvalidMessage?: string;
  visible?: boolean; // 컴포넌트 표시 여부
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
  // DevExtreme 기본 props 추가 지원
  width?: number | string;
  height?: number | string;
  disabled?: boolean;
  tabIndex?: number;
  maxLength?: number;
  showClearButton?: boolean;
  onKeyDown?: (e: any) => void;
}

/**
 * 단일 라인 텍스트 입력 컴포넌트
 *
 * 이름, 제목, 이메일, 전화번호 등 한 줄 텍스트 입력에 사용합니다.
 * mode 속성으로 모바일 최적화 키보드를 제공하고, mask로 입력 형식을 제한할 수 있습니다.
 *
 * @example
 * <TextBox
 *   fieldName="phone"
 *   mode="tel"
 *   mask="000-0000-0000"
 *   placeholder="010-1234-5678"
 * />
 *
 * // 숨김 처리 예시
 * <TextBox
 *   fieldName="hidden_field"
 *   value={hiddenValue}
 *   visible={false}
 * />
 */
export function TextBox<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  mode = "text",
  showPasswordToggle = false,
  mask,
  maskChar = "_",
  maskInvalidMessage,
  visible = true,
  onValueChanged,
  getFieldProps,
  width,
  height,
  disabled,
  tabIndex,
  maxLength,
  showClearButton,
  onKeyDown,
}: Props<T>) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  const input = (
    <DevTextBox
      value={value}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      mode={showPasswordToggle ? (passwordVisible ? "text" : "password") : mode}
      mask={mask}
      maskChar={maskChar}
      maskInvalidMessage={maskInvalidMessage}
      visible={visible}
      width={width}
      height={height}
      disabled={disabled}
      tabIndex={tabIndex}
      maxLength={maxLength}
      showClearButton={showClearButton}
      valueChangeEvent="input"
      onValueChanged={handleValueChanged}
      onKeyDown={onKeyDown}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );

  if (!showPasswordToggle) return input;

  return (
    <div className="relative">
      {input}
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setPasswordVisible((v) => !v)}
      >
        <i className={`dx-icon dx-icon-${passwordVisible ? "eyeopen" : "eyeclose"}`} style={{ fontSize: 18 }} />
      </button>
    </div>
  );
}
