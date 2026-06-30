"use client";

import React from "react";
import TreeList, { Column, HeaderFilter } from "devextreme-react/tree-list";
import { Loading } from "@/components/shared/Feedback";

/**
 * TreeGridPanel: DevExtreme TreeList 기반 트리 구조 데이터 표시 컴포넌트
 */
interface Props {
  treeData: any[];
  isLoading?: boolean;
  keyExpr?: string;
  parentIdExpr?: string;
  keyColumn?: {
    dataField: string;
    caption: string;
    width?: number;
  };
  valueColumn?: {
    dataField: string;
    caption: string;
    width?: number;
  };
  additionalColumns?: Array<{
    dataField: string;
    caption: string;
    width?: number;
    cellRender?: (data: any) => React.ReactNode;
  }>;
  actions?: React.ReactNode;
  autoExpandAll?: boolean;
  emptyMessage?: string;
  showBorders?: boolean;
  showHeaderFilter?: boolean;
  columnAutoWidth?: boolean;
  cellVerticalAlign?: "top" | "middle" | "bottom";
}

export function TreeGridPanel({
  treeData,
  isLoading = false,
  keyExpr = "id",
  parentIdExpr = "parentId",
  keyColumn = { dataField: "key", caption: "속성", width: 300 },
  valueColumn = { dataField: "value", caption: "값" },
  additionalColumns = [],
  actions,
  autoExpandAll = true,
  emptyMessage = "데이터가 없습니다",
  showBorders = true,
  showHeaderFilter = true,
  columnAutoWidth = true,
  cellVerticalAlign = "top",
}: Props) {
  return (
    <div className="h-full flex flex-col relative">
      <Loading visible={isLoading} message="로딩 중..." position={{ of: "#treeGridPanel" }} />

      {actions && <div className="flex-shrink-0 mb-2">{actions}</div>}

      <div id="treeGridPanel" className="flex-1 min-h-0 overflow-auto">
        {treeData && treeData.length > 0 ? (
          <div className="tree-grid-panel">
            <TreeList
              dataSource={treeData}
              keyExpr={keyExpr}
              parentIdExpr={parentIdExpr}
              elementAttr={{ class: cellVerticalAlign === "top" ? "" : `dx-grid-valign-${cellVerticalAlign}` }}
              showBorders={showBorders}
              showRowLines={true}
              showColumnLines={true}
              columnAutoWidth={columnAutoWidth}
              wordWrapEnabled={true}
              autoExpandAll={autoExpandAll}
            >
              <Column dataField={keyColumn.dataField} caption={keyColumn.caption} width={keyColumn.width} />
              <Column dataField={valueColumn.dataField} caption={valueColumn.caption} width={valueColumn.width} />
              {additionalColumns.map((col, index) => (
                <Column
                  key={index}
                  dataField={col.dataField}
                  caption={col.caption}
                  width={col.width}
                  cellRender={col.cellRender}
                />
              ))}
              {showHeaderFilter && <HeaderFilter visible={true} />}
            </TreeList>
          </div>
        ) : (
          !isLoading && <div className="flex items-center justify-center h-full text-gray-500">{emptyMessage}</div>
        )}
      </div>

      <style jsx global>{`
        .tree-grid-panel .dx-treelist-headers {
          background-color: rgb(209 213 219);
          font-weight: 500;
        }
        .tree-grid-panel .dx-header-row {
          background-color: rgb(209 213 219);
        }
        .tree-grid-panel .dx-treelist .dx-data-row > td:first-child {
          background-color: rgb(243 244 246);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
