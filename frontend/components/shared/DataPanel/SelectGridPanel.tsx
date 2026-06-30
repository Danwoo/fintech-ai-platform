// components/shared/DataPanel/SelectGridPanel.tsx
"use client";

import React, { useRef, useCallback, useMemo } from "react";
import { DataGridTypes } from "devextreme-react/data-grid";
import { Button, Popup } from "@/components/shared/ui";
import type { ActionButton } from "@/components/shared/ui";
import { SelectGrid } from "@/components/shared/DataGrid";
import { useSelectGridData } from "@/hooks/shared/useSelectGridData";
import { useSelectGridActions } from "@/hooks/shared/useSelectGridActions";

export interface Props<T = any> {
  title: string;
  fetchGrid: (params?: any) => Promise<{ items: T[]; total_count: number } | null>;
  columns: DataGridTypes.Column[];
  keyField?: string;
  valueField?: string;
  displayField: string;
  dependencies?: any[];
  onSelect: (selectedData: T, key: any, displayValue: string) => void;
  onCancel?: () => void;
  allowClearSelection?: boolean;
  height?: string;
  customActions?: ActionButton[];
  onDataChanged?: () => void;
  asPopup?: boolean;
  popupVisible?: boolean;
  onPopupHiding?: () => void;
  popupWidth?: number | string;
  popupHeight?: number | string;
  cellVerticalAlign?: "top" | "middle" | "bottom";
}

export function SelectGridPanel<T>({
  title,
  fetchGrid,
  columns,
  keyField = "rn",
  valueField,
  displayField,
  dependencies = [],
  onSelect,
  onCancel,
  allowClearSelection = false,
  height = "100%",
  customActions = [],
  onDataChanged,
  asPopup = false,
  popupVisible = false,
  onPopupHiding,
  popupWidth = "800px",
  popupHeight = "600px",
  cellVerticalAlign = "top",
}: Props<T>) {
  const gridRef = useRef<any>(null);

  const { dataSource, selectedData, handleSelect, handleClearSelection, refreshGrid } = useSelectGridData({
    fetchGrid,
    keyField,
    onDataChanged,
    dependencies,
  });

  const handleSelectionChanged = useCallback(
    (data: T | null) => {
      if (data) {
        handleSelect(data);
      }
    },
    [handleSelect],
  );

  const handleRowDoubleClick = useCallback(
    (data: T) => {
      if (data) {
        const actualValueField = valueField || keyField;
        const key = (data as any)[actualValueField];
        const displayValue = (data as any)[displayField];

        onSelect(data, key, displayValue);

        if (asPopup && onPopupHiding) {
          onPopupHiding();
        }
      }
    },
    [keyField, valueField, displayField, onSelect, asPopup, onPopupHiding],
  );

  const handleSelectAction = useCallback(() => {
    if (selectedData) {
      const actualValueField = valueField || keyField;
      const key = (selectedData as any)[actualValueField];
      const displayValue = (selectedData as any)[displayField];

      onSelect(selectedData, key, displayValue);

      if (asPopup && onPopupHiding) {
        onPopupHiding();
      }
    }
  }, [selectedData, keyField, valueField, displayField, onSelect, asPopup, onPopupHiding]);

  const handleClearSelectionAction = useCallback(() => {
    handleClearSelection();
    onSelect(null as any, null, "");

    if (asPopup && onPopupHiding) {
      onPopupHiding();
    }
  }, [handleClearSelection, onSelect, asPopup, onPopupHiding]);

  const handleCancelAction = useCallback(() => {
    if (onCancel) {
      onCancel();
    }

    if (asPopup && onPopupHiding) {
      onPopupHiding();
    }
  }, [onCancel, asPopup, onPopupHiding]);

  const buttons = useSelectGridActions({
    onRefresh: refreshGrid,
    onSelect: handleSelectAction,
    onClearSelection: allowClearSelection ? handleClearSelectionAction : undefined,
    onCancel: onCancel || asPopup ? handleCancelAction : undefined,
    selectedData,
    allowClearSelection,
    asPopup,
    customActions,
  });

  const memoizedColumns = useMemo(() => columns, [columns]);

  const panelContent = (
    <div className="h-full flex flex-col" style={{ height: asPopup ? "100%" : height }}>
      <div className="flex justify-between items-center p-2">
        <h2 className="text-lg text-gray-700">🔍 {title}</h2>
        <div className="flex gap-2">
          {buttons
            .filter((button) => button.visible !== false)
            .map((button, idx) => {
              const { visible, sort: _sort, ...buttonProps } = button;
              return <Button key={idx} {...buttonProps} />;
            })}
        </div>
      </div>

      <div className="flex-1 min-h-0 border-t">
        <SelectGrid
          ref={gridRef}
          dataSource={dataSource}
          columns={memoizedColumns}
          onSelectionChanged={handleSelectionChanged}
          onRowDoubleClick={handleRowDoubleClick}
          selectedData={selectedData}
          cellVerticalAlign={cellVerticalAlign}
        />
      </div>
    </div>
  );

  if (asPopup) {
    return (
      <Popup
        visible={popupVisible}
        width={popupWidth}
        height={popupHeight}
        onHiding={onPopupHiding}
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={true}
        shading={true}
        hideOnOutsideClick={false}
        showTitle={false}
      >
        {panelContent}
      </Popup>
    );
  }

  return panelContent;
}
