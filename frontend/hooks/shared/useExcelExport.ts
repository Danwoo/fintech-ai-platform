// hooks/shared/useExcelExport.ts
import { useCallback } from "react";
import { Workbook } from "devextreme-exceljs-fork";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import type { DataGridTypes } from "devextreme-react/data-grid";
import { showToast } from "@/components/shared/Feedback";
import { getKSTTime } from "@/utils/common/timeUtils";

interface Params {
  gridRef: React.RefObject<any>;
  fileName?: string;
  columns?: DataGridTypes.Column[];
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Excel 다운로드 커스텀 훅
 * DevExtreme의 공식 exportDataGrid를 사용하여 그리드 데이터를 Excel로 내보냅니다.
 * 필터, 정렬, 그룹핑 등 모든 그리드 상태를 자동으로 유지합니다.
 */
export const useExcelExport = ({ gridRef, fileName = "download", columns, onLoadingChange }: Params) => {
  const handleExcelDownload = useCallback(async () => {
    try {
      onLoadingChange?.(true);

      if (!gridRef.current) {
        console.warn("Grid reference is not available");
        return;
      }

      const gridInstance = gridRef.current.instance();
      if (!gridInstance) {
        console.warn("Grid instance is not available");
        return;
      }

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Data");

      await exportDataGrid({
        component: gridInstance,
        worksheet: worksheet,
        autoFilterEnabled: true,
        customizeCell: ({ gridCell, excelCell }) => {
          if (!gridCell || !excelCell) return;

          // 헤더 스타일링
          if (gridCell.rowType === "header") {
            excelCell.font = {
              bold: true,
              name: "Arial",
              size: 11,
            };
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE0E0E0" },
            };
            excelCell.alignment = {
              horizontal: "center",
              vertical: "middle",
            };
          }
          // 그룹 헤더 스타일링
          else if (gridCell.rowType === "group") {
            excelCell.font = {
              bold: true,
              name: "Arial",
              size: 10,
            };
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F0F0" },
            };
          }
          // 데이터 셀 스타일링
          else if (gridCell.rowType === "data") {
            excelCell.font = {
              name: "Arial",
              size: 10,
            };

            const columnType = gridCell.column?.dataType;

            if (columnType === "number") {
              excelCell.numFmt = "#,##0";
              excelCell.alignment = { horizontal: "right" };
            } else if (columnType === "date") {
              excelCell.numFmt = "yyyy-mm-dd";
              excelCell.alignment = { horizontal: "center" };
            } else if (columnType === "datetime") {
              excelCell.numFmt = "yyyy-mm-dd hh:mm:ss";
              excelCell.alignment = { horizontal: "center" };
            }
          }
          // 총계 행 스타일링
          else if (gridCell.rowType === "totalFooter") {
            excelCell.font = {
              bold: true,
              name: "Arial",
              size: 10,
            };
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFCC00" },
            };
          }
        },
      });

      // 컬럼 너비 설정
      if (columns && columns.length > 0) {
        columns.forEach((col, index) => {
          if (col.dataField) {
            const column = worksheet.getColumn(index + 1);
            const width = typeof col.width === "number" ? col.width : 120;
            column.width = width / 8;
          }
        });
      } else {
        worksheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value?.toString() ?? "";
            const columnLength = cellValue.length;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength, 10), 50);
        });
      }

      // KST 타임스탬프 생성
      const kstTime = getKSTTime();
      const year = kstTime.getUTCFullYear();
      const month = String(kstTime.getUTCMonth() + 1).padStart(2, "0");
      const day = String(kstTime.getUTCDate()).padStart(2, "0");
      const hours = String(kstTime.getUTCHours()).padStart(2, "0");
      const minutes = String(kstTime.getUTCMinutes()).padStart(2, "0");
      const seconds = String(kstTime.getUTCSeconds()).padStart(2, "0");

      const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      const finalFileName = `${fileName}_${timestamp}.xlsx`;

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, finalFileName);
    } catch (error) {
      showToast("Excel 다운로드 중 오류가 발생했습니다.", "error");
      throw error;
    } finally {
      onLoadingChange?.(false);
    }
  }, [gridRef, fileName, columns, onLoadingChange]);

  return { handleExcelDownload };
};
