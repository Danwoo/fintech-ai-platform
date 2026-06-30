// components/shared/Layout/TableCell.tsx
import { ReactNode, isValidElement } from "react";
import { useTableGroupMode } from "./TableGroup";

export type DataType = "string" | "number" | "date" | "boolean" | "datetime";

interface Props {
  label?: string;
  required?: boolean;
  children?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  items?: any[];
  valueExpr?: string;
  displayExpr?: string | ((item: any) => string);
  height?: string | number;
  maxHeight?: string | number;
  overflowY?: "visible" | "hidden" | "scroll" | "auto";
  whiteSpace?: "normal" | "pre-wrap" | "pre" | "nowrap";
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  dataType?: DataType;
  format?: string;
}

export function TableCell({
  label,
  required = false,
  children,
  colSpan = 1,
  rowSpan = 1,
  items,
  valueExpr = "code",
  displayExpr = "code_nm",
  height,
  maxHeight,
  overflowY = "visible",
  whiteSpace = "normal",
  className = "",
  labelClassName = "p-2 bg-gray-100 border border-gray-300 font-medium",
  contentClassName = "p-2 border border-gray-300",
  dataType = "string",
  format,
}: Props) {
  const getDisplayValue = () => {
    if (!items || typeof children !== "string") return children;

    const matchedItem = items.find((item) => {
      const itemValue = item[valueExpr] || item.code || item.value;
      return itemValue === children || String(itemValue) === children;
    });

    if (!matchedItem) return children;

    if (typeof displayExpr === "function") {
      return displayExpr(matchedItem);
    }

    return matchedItem[displayExpr] || matchedItem.code_nm || matchedItem.text || children;
  };

  const mode = useTableGroupMode();
  const displayValue = getDisplayValue();
  const contentStyle = {
    whiteSpace,
    ...(height !== undefined ? { height } : {}),
    ...(maxHeight !== undefined ? { maxHeight } : {}),
    ...(height !== undefined || maxHeight !== undefined ? { overflowY } : {}),
  };

  const formatValue = (value: any, type: DataType, pattern?: string) => {
    if (value === null || value === undefined || value === "") {
      return "\u00A0";
    }

    if (isValidElement(value)) {
      return value;
    }

    if (typeof value === "object" && value !== null) {
      return value;
    }

    switch (type) {
      case "number": {
        const numValue = Number(value);
        if (isNaN(numValue)) return String(value);

        if (pattern) {
          if (pattern === "#0.####") return numValue.toFixed(4);
          if (pattern === "#,##0") return numValue.toLocaleString();
          if (pattern === "#0.##") return numValue.toFixed(2);
          if (pattern === "#0") return Math.round(numValue).toString();
        }
        return String(numValue);
      }

      case "boolean":
        return value ? "true" : "false";

      case "date": {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);

        if (pattern) {
          if (pattern === "yyyy-MM-dd") {
            return date.toISOString().split("T")[0];
          }
          if (pattern === "yyyy-MM-dd HH:mm:ss") {
            return date.toISOString().replace("T", " ").slice(0, 19);
          }
          if (pattern === "MM/dd/yyyy") {
            return date.toLocaleDateString("en-US");
          }
        }
        return date.toLocaleDateString();
      }

      case "datetime": {
        const dateTime = new Date(value);
        if (isNaN(dateTime.getTime())) return String(value);

        if (pattern) {
          if (pattern === "yyyy-MM-dd HH:mm:ss") {
            return dateTime.toISOString().replace("T", " ").slice(0, 19);
          }
        }
        return dateTime.toLocaleString();
      }

      case "string":
      default:
        return String(value);
    }
  };

  const content = (
    <div className="break-all" style={contentStyle}>
      {formatValue(displayValue, dataType, format)}
    </div>
  );
  const hasContent = displayValue !== null && displayValue !== undefined && displayValue !== "";

  if (mode === "flex") {
    if (label !== undefined) {
      return (
        <>
          <div className={labelClassName}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className={`${contentClassName} ${className} flex-1 min-h-0`}>{children}</div>
        </>
      );
    }
    return <div className={`${contentClassName} ${className} flex-1 min-h-0`}>{children}</div>;
  }

  if (label !== undefined) {
    return (
      <>
        <td className={labelClassName} rowSpan={rowSpan}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </td>
        <td className={`${contentClassName} ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
          {content}
        </td>
      </>
    );
  }

  return (
    <td
      className={`${contentClassName} ${className}`}
      colSpan={!hasContent ? Math.max(colSpan, 2) : colSpan}
      rowSpan={rowSpan}
    >
      {content}
    </td>
  );
}
