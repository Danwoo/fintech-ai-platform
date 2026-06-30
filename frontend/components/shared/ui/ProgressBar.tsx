// components/shared/ui/ProgressBar.tsx
import React from "react";
import DevProgressBar from "devextreme-react/progress-bar";

interface Props<T = any> {
  fieldName: keyof T;
  value?: number; // 진행률 (0-100)
  max?: number;
  showText?: boolean;
  showPercentage?: boolean;
  height?: number;
  statusFormat?: (ratio: number, value: number) => string;
  text?: string;
  variant?: "default" | "success" | "warning" | "danger";
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 진행바 컴포넌트
 *
 * 작업 진행률, 완료도, 수치의 비율 등을 시각적으로 표시합니다.
 * 파일 업로드, 데이터 처리 상태, 목표 달성률 등에 사용합니다.
 *
 * @example
 * <ProgressBar
 *   fieldName="uploadProgress"
 *   value={75}
 *   showPercentage
 *   variant="success"
 * />
 */
export function ProgressBar<T = any>({
  fieldName,
  value = 0,
  max = 100,
  showText = false,
  showPercentage = false,
  height = 16,
  statusFormat,
  text,
  variant = "default",
  getFieldProps,
}: Props<T>) {
  const variantColors: Record<string, string> = {
    default: "#1976d2",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
  };

  const barColor = variantColors[variant] || variantColors.default;

  const formatStatus =
    statusFormat ||
    ((ratio: number, val: number) =>
      showPercentage ? `${Math.round(ratio * 100)}%` : showText ? text || "진행률" : "");

  return (
    <div {...(getFieldProps ? getFieldProps(fieldName) : {})}>
      {(showText || text) && <div className="mb-2 text-sm font-medium text-gray-700">{text || "진행률"}</div>}

      <DevProgressBar
        min={0}
        max={max}
        value={value}
        height={height}
        statusFormat={formatStatus}
        showStatus={showText || showPercentage}
        className="w-full"
        style={{
          ...(barColor ? { "--dx-color-primary": barColor } : {}),
        }}
      />

      {!showText && !showPercentage && (
        <div className="text-center mt-1">
          <span className="text-xs text-gray-600">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
}
