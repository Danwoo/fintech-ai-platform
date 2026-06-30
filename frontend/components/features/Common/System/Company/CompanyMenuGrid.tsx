// components/features/Common/System/Company/CompanyMenuGrid.tsx
"use client";

import React from "react";
import { DetailGridPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { selectCompanyMenus } from "@/services/common/companyService";

interface Props {
  companyId: number;
  height?: string;
}

const GRID_COLUMNS: DataGridTypes.Column[] = [
  { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
  { dataField: "menu_id", caption: "메뉴ID", width: 120 },
  { dataField: "menu_nm", caption: "메뉴명" },
  { dataField: "reg_dt", caption: "생성일시", width: 160, dataType: "datetime" },
];

/** 회사가 부여받은 메뉴 목록 (read-only). 부여/회수는 수정 폼의 DualSelectGrid 에서 수행. */
const CompanyMenuGrid: React.FC<Props> = ({ companyId, height = "100%" }) => {
  return (
    <DetailGridPanel
      key={`${companyId}_menu`}
      fetchGrid={async () => {
        const result = await selectCompanyMenus(companyId);
        if (!result) return null;
        const items = result.companyMenus.map((m, index) => ({
          rn: index + 1,
          menu_id: m.menu_id,
          menu_nm: m.menu?.menu_nm ?? m.menu_id,
          reg_dt: m.reg_dt,
          use_at: m.menu?.use_at ?? null,
        }));
        return { items, total_count: items.length };
      }}
      columns={GRID_COLUMNS}
      keyField="menu_id"
      showPaging={false}
      clientSidePaging={true}
      editable={false}
      inactiveExpr="use_at"
      height={height}
    />
  );
};

export default React.memo(CompanyMenuGrid);
