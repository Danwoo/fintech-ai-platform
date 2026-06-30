// components/shared/ui/DateBox.tsx
import DevDateBox from "devextreme-react/date-box";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string; // YYYY-MM-DD 형식
  placeholder?: string;
  readOnly?: boolean;
  type?: "date" | "datetime" | "time";
  displayFormat?: string;
  min?: Date | string;
  max?: Date | string;
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * 날짜 선택 컴포넌트
 *
 * 생년월일, 입사일, 계약일 등 날짜 입력에 사용합니다.
 * 달력 UI를 제공하며 날짜, 날짜+시간, 시간만 선택하는 모드를 지원합니다.
 *
 * @example
 * <DateBox fieldName="birthDate" type="datetime" displayFormat="yyyy-MM-dd HH:mm" />
 */
export function DateBox<T = any>({
  fieldName,
  value,
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
    if (!e.value) {
      onValueChanged(fieldName, null);
      return;
    }

    let dateValue: string;

    switch (type) {
      case "date":
        dateValue = e.value.toISOString().split("T")[0];
        break;
      case "datetime":
        dateValue = e.value.toISOString();
        break;
      case "time":
        dateValue = e.value.toTimeString().split(" ")[0];
        break;
      default:
        dateValue = e.value.toISOString().split("T")[0];
    }

    onValueChanged(fieldName, dateValue);
  };

  return (
    <DevDateBox
      value={value ? new Date(value) : null}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      type={type}
      displayFormat={displayFormat}
      min={min}
      max={max}
      onValueChanged={handleDateValueChange}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
