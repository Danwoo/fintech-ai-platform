// components/shared/DataGrid/SelectGrid.tsx
"use client";

import React, { useState, memo, useMemo, useCallback, useEffect, forwardRef } from "react";
import DataGrid, {
  Column,
  Paging,
  Pager,
  Selection,
  FilterRow,
  HeaderFilter,
  Sorting,
  Scrolling,
  ColumnFixing,
  DataGridTypes,
  RemoteOperations,
  GroupPanel,
  Grouping,
  Summary,
} from "devextreme-react/data-grid";
import DataSource from "devextreme/data/data_source";
import { PAGE_SIZE, ALLOWED_PAGE_SIZES } from "@/constants/app";

// cellRender를 지원하는 확장된 Column 타입
interface ExtendedColumn extends DataGridTypes.Column {
  cellRender?: (cellData: DataGridTypes.ColumnCellTemplateData) => React.ReactNode;
}

interface Props<T> {
  dataSource: DataSource;
  columns: ExtendedColumn[];
  clientSidePaging?: boolean;
  showPaging?: boolean;
  pageSize?: number;
  useGrouping?: boolean;
  useSummary?: boolean;
  height?: string;
  selectedData?: T | null;
  onSelectionChanged?: (selectedData: T) => void;
  onRowDoubleClick?: (selectedData: T) => void;
  selectionMode?: "single" | "multiple";
  selectedRowKeys?: Array<string | number>;
  onSelectedRowKeysChange?: (keys: Array<string | number>, rows: T[]) => void;
  selectAllMode?: "page" | "allPages";
  showCheckBoxesMode?: "always" | "onClick" | "onLongTap" | "none";
  cellVerticalAlign?: "top" | "middle" | "bottom";
}

function SelectGridComponent<T>(
  {
    dataSource,
    columns,
    clientSidePaging = false,
    showPaging = true,
    pageSize = PAGE_SIZE.SELECT,
    useGrouping = false,
    useSummary = false,
    height = "100%",
    selectedData,
    onSelectionChanged,
    onRowDoubleClick,
    selectionMode = "single",
    selectedRowKeys,
    onSelectedRowKeysChange,
    selectAllMode = "page",
    showCheckBoxesMode = "always",
    cellVerticalAlign = "top",
  }: Props<T>,
  ref: React.Ref<any>,
) {
  const [rowKey, setRowKey] = useState<string | number | undefined>(undefined);

  useEffect(() => {
    if (selectedData === null) {
      setRowKey(undefined);
    }
  }, [selectedData]);

  useEffect(() => {
    setRowKey(undefined);
  }, [dataSource]);

  const handleFocusedRowChanged = useCallback(
    (e: DataGridTypes.FocusedRowChangedEvent<T>) => {
      try {
        const key = e.row?.key;
        if (key !== undefined && (typeof key === "string" || typeof key === "number")) {
          setRowKey(key);
          if (onSelectionChanged && e.row?.data) {
            onSelectionChanged(e.row.data);
          }
        } else {
          setRowKey(undefined);
        }
      } catch (error) {
        console.error("포커스 행 변경 중 오류:", error);
      }
    },
    [onSelectionChanged],
  );

  const handleSelectionChanged = useCallback(
    (e: DataGridTypes.SelectionChangedEvent<T>) => {
      if (selectionMode === "multiple") {
        onSelectedRowKeysChange?.(e.selectedRowKeys as Array<string | number>, e.selectedRowsData);
        return;
      }
      try {
        const key = e.selectedRowKeys[0];
        if (typeof key === "string" || typeof key === "number") {
          setRowKey(key);
          const selected = e.selectedRowsData[0];
          if (onSelectionChanged && selected) {
            onSelectionChanged(selected);
          }
        } else {
          setRowKey(undefined);
        }
      } catch (error) {
        console.error("선택 변경 중 오류:", error);
      }
    },
    [selectionMode, onSelectedRowKeysChange, onSelectionChanged],
  );

  const handleRowDoubleClick = useCallback(
    (e: DataGridTypes.RowDblClickEvent<T>) => {
      try {
        if (onRowDoubleClick && e.data) {
          onRowDoubleClick(e.data);
        }
      } catch (error) {
        console.error("더블클릭 처리 중 오류:", error);
      }
    },
    [onRowDoubleClick],
  );

  const handleRowPrepared = useCallback((e: DataGridTypes.RowPreparedEvent<T>) => {
    if (e.rowElement) {
      e.rowElement.style.cursor = "pointer";
    }
  }, []);

  const memoizedColumns = useMemo(() => {
    return columns.filter((col) => col.dataField?.trim());
  }, [columns]);

  const getDefaultFormat = useCallback((dataType?: string) => {
    switch (dataType) {
      case "number":
        return "#,##0";
      case "datetime":
        return "yyyy-MM-dd HH:mm:ss";
      case "date":
        return "yyyy-MM-dd";
      default:
        return undefined;
    }
  }, []);

  return (
    <DataGrid<T, string | number>
      ref={ref}
      dataSource={dataSource}
      height={height}
      elementAttr={{ class: cellVerticalAlign === "top" ? "" : `dx-grid-valign-${cellVerticalAlign}` }}
      showBorders={true}
      wordWrapEnabled={true}
      allowColumnResizing={true}
      columnResizingMode="widget"
      columnAutoWidth={false}
      repaintChangesOnly={true}
      cacheEnabled={true}
      hoverStateEnabled={true}
      onSelectionChanged={handleSelectionChanged}
      onFocusedRowChanged={handleFocusedRowChanged}
      onRowPrepared={handleRowPrepared}
      focusedRowEnabled={selectionMode === "single"}
      focusedRowKey={selectionMode === "single" ? rowKey : undefined}
      selectedRowKeys={selectionMode === "multiple" ? (selectedRowKeys ?? []) : rowKey !== undefined ? [rowKey] : []}
      onRowDblClick={handleRowDoubleClick}
    >
      <RemoteOperations
        filtering={!clientSidePaging}
        paging={!clientSidePaging}
        sorting={!clientSidePaging}
        grouping={useGrouping && !clientSidePaging}
        summary={useSummary && !clientSidePaging}
      />
      <Scrolling columnRenderingMode="standard" rowRenderingMode="standard" useNative={false} />
      <Sorting mode="single" />
      <Selection
        mode={selectionMode}
        selectAllMode={selectAllMode}
        showCheckBoxesMode={selectionMode === "multiple" ? showCheckBoxesMode : undefined}
      />

      {showPaging && (
        <>
          <Paging defaultPageSize={pageSize} enabled={true} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={ALLOWED_PAGE_SIZES}
            showNavigationButtons={true}
            showInfo={true}
            displayMode="full"
            visible={true}
          />
        </>
      )}

      <HeaderFilter visible />
      <FilterRow visible />

      <ColumnFixing enabled />

      {useGrouping && (
        <>
          <Grouping autoExpandAll={false} />
          <GroupPanel visible={false} />
        </>
      )}
      {useSummary && <Summary />}

      {memoizedColumns.map((column) => (
        <Column
          key={column.dataField}
          {...({
            ...column,
            format: column.format ?? getDefaultFormat(column.dataType),
          } as any)}
        />
      ))}
    </DataGrid>
  );
}

export const SelectGrid = memo(forwardRef(SelectGridComponent)) as <T>(
  props: Props<T> & { ref?: React.Ref<any> },
) => React.ReactElement;

(SelectGrid as any).displayName = "SelectGrid";
