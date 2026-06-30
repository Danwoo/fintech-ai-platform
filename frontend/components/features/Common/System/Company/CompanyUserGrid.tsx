// components/features/Common/System/Company/CompanyUserGrid.tsx
"use client";

import React from "react";
import { DetailGridPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { selectCompanyUsers } from "@/services/common/companyService";

interface Props {
  companyId: number;
  height?: string;
}

const GRID_COLUMNS: DataGridTypes.Column[] = [
  { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
  { dataField: "email", caption: "이메일", width: 280 },
  { dataField: "name", caption: "이름", width: 120 },
  { dataField: "dept", caption: "부서", width: 140 },
  { dataField: "author_nm", caption: "권한", minWidth: 150, allowFiltering: false, allowSorting: false },
  {
    dataField: "appr_at",
    caption: "승인",
    width: 90,
    lookup: {
      dataSource: [
        { value: "Y", text: "승인" },
        { value: "N", text: "대기" },
        { value: "R", text: "거부" },
      ],
      displayExpr: "text",
      valueExpr: "value",
    },
  },
  {
    dataField: "use_at",
    caption: "사용",
    width: 90,
    lookup: {
      dataSource: [
        { value: "Y", text: "활성" },
        { value: "N", text: "비활성" },
      ],
      displayExpr: "text",
      valueExpr: "value",
    },
  },
  { dataField: "reg_dt", caption: "가입일시", width: 160, dataType: "datetime" },
];

const CompanyUserGrid: React.FC<Props> = ({ companyId, height = "100%" }) => {
  return (
    <DetailGridPanel
      key={companyId}
      fetchGrid={async (params: any) => selectCompanyUsers({ ...params, company_id: companyId })}
      columns={GRID_COLUMNS}
      keyField="email"
      editable={false}
      height={height}
    />
  );
};

export default React.memo(CompanyUserGrid);
