// components/shared/DataGrid/DualSelectGrid.tsx
"use client";

import { useRef } from "react";
import { DataGrid } from "devextreme-react/data-grid";
import { DataGridTypes } from "devextreme-react/data-grid";
import { Button } from "@/components/shared/ui";

interface Props {
  title: string;
  leftTitle: string;
  rightTitle: string;
  leftData: any[];
  rightData: any[];
  leftColumns: DataGridTypes.Column[];
  rightColumns: DataGridTypes.Column[];
  leftKeyExpr: string;
  rightKeyExpr: string;
  loading?: boolean;
  height?: string;
  fillHeight?: boolean;
  className?: string;
  inactiveExpr?: string;
  cellVerticalAlign?: "top" | "middle" | "bottom";
  onAdd: () => void | Promise<void>;
  onRemove: () => void | Promise<void>;
  onLeftSelectionChanged: (selectedKeys: string[]) => void;
  onRightSelectionChanged: (selectedKeys: string[]) => void;
}

export function DualSelectGrid({
  title,
  leftTitle,
  rightTitle,
  leftData,
  rightData,
  leftColumns,
  rightColumns,
  leftKeyExpr,
  rightKeyExpr,
  loading = false,
  height = "16rem",
  fillHeight = false,
  className = "mt-4",
  inactiveExpr,
  cellVerticalAlign = "top",
  onAdd,
  onRemove,
  onLeftSelectionChanged,
  onRightSelectionChanged,
}: Props) {
  const leftGridRef = useRef<any>(null);
  const rightGridRef = useRef<any>(null);

  const handleAdd = async () => {
    await onAdd();
    leftGridRef.current?.instance()?.deselectAll();
  };

  const handleRemove = async () => {
    await onRemove();
    rightGridRef.current?.instance()?.deselectAll();
  };

  return (
    <div className={fillHeight ? "h-full flex flex-col" : className}>
      <h3
        className={`font-medium text-gray-700 text-sm bg-gray-300 border border-gray-300 border-b-0 p-2${fillHeight ? " flex-shrink-0" : ""}`}
      >
        {title}
      </h3>
      <div
        className={`flex gap-2 border border-gray-300 p-2${fillHeight ? " flex-1 min-h-0" : ""}`}
        style={fillHeight ? undefined : { height }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 text-sm font-medium text-gray-700 bg-gray-300 border border-gray-300 border-b-0 p-2">
            {leftTitle}
          </div>
          {loading ? (
            <div className="flex items-center justify-center flex-1 text-gray-500">로딩 중...</div>
          ) : (
            <div className="flex-1 min-h-0">
              <DataGrid
                ref={leftGridRef}
                dataSource={leftData}
                columns={leftColumns}
                elementAttr={{ class: cellVerticalAlign === "top" ? "" : `dx-grid-valign-${cellVerticalAlign}` }}
                showBorders={true}
                rowAlternationEnabled={true}
                height="100%"
                keyExpr={leftKeyExpr}
                selection={{ mode: "multiple", showCheckBoxesMode: "always" }}
                paging={{ enabled: false }}
                onSelectionChanged={(e) => onLeftSelectionChanged(e.selectedRowKeys as string[])}
                onRowClick={(e) => {
                  if (e.rowType !== "data") return;
                  const keys: string[] = e.component.getSelectedRowKeys();
                  if (keys.includes(e.key)) e.component.deselectRows([e.key]);
                  else e.component.selectRows([e.key], true);
                }}
                onRowPrepared={(e) => {
                  if (e.rowType !== "data") return;
                  if (inactiveExpr && e.data[inactiveExpr] !== "Y") {
                    e.rowElement.style.color = "#c4c4c4";
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center items-center gap-2">
          <Button icon="arrowright" stylingMode="contained" type="success" onClick={handleAdd} />
          <Button icon="arrowleft" stylingMode="contained" type="danger" onClick={handleRemove} />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 text-sm font-medium text-gray-700 bg-gray-300 border border-gray-300 border-b-0 p-2">
            {rightTitle}
          </div>
          <div className="flex-1 min-h-0">
            <DataGrid
              ref={rightGridRef}
              dataSource={rightData}
              columns={rightColumns}
              elementAttr={{ class: cellVerticalAlign === "top" ? "" : `dx-grid-valign-${cellVerticalAlign}` }}
              showBorders={true}
              rowAlternationEnabled={true}
              height="100%"
              keyExpr={rightKeyExpr}
              selection={{ mode: "multiple", showCheckBoxesMode: "always" }}
              paging={{ enabled: false }}
              onSelectionChanged={(e) => onRightSelectionChanged(e.selectedRowKeys as string[])}
              onRowClick={(e) => {
                if (e.rowType !== "data") return;
                const keys: string[] = e.component.getSelectedRowKeys();
                if (keys.includes(e.key)) e.component.deselectRows([e.key]);
                else e.component.selectRows([e.key], true);
              }}
              onRowPrepared={(e) => {
                if (e.rowType === "data" && inactiveExpr && e.data[inactiveExpr] !== "Y") {
                  e.rowElement.style.color = "#c4c4c4";
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
