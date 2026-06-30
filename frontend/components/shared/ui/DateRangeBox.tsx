import React from "react";
import { DateRangeBox as DxDateRangeBox } from "devextreme-react/date-range-box";

interface Props<T = any> {
  fieldName?: keyof T;
  value?: [Date | string | null, Date | string | null];
  placeholder?: string;
  readOnly?: boolean;
  type?: "date" | "datetime";
  displayFormat?: string;
  min?: Date | string | null;
  max?: Date | string | null;
  onValueChanged: (fieldName: keyof T | undefined, value: [string | null, string | null]) => void;
  getFieldProps?: (fieldName?: keyof T) => any;
}

export function DateRangeBox<T = any>({
  fieldName,
  value = [null, null],
  placeholder,
  readOnly = false,
  type = "date",
  displayFormat = "yyyy-MM-dd",
  min,
  max,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleDateValueChange = (e: any) => {
    const arr = Array.isArray(e.value) ? e.value : [null, null];
    onValueChanged(fieldName, [arr[0] ? arr[0].toISOString() : null, arr[1] ? arr[1].toISOString() : null]);
  };

  const customStyle = { width: type === "date" ? "250px" : undefined };

  return (
    <DxDateRangeBox
      value={[value[0], value[1]]}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      type={type}
      displayFormat={displayFormat}
      min={min ? new Date(min) : undefined}
      max={max ? new Date(max) : undefined}
      onValueChanged={handleDateValueChange}
      acceptCustomValue={true}
      style={customStyle}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
