// components/features/Common/System/Author/AuthorUserGrid.tsx
"use client";

import React from "react";
import { DetailGridPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { selectAuthorUsers } from "@/services/common/authorService";

interface Props {
  authorId: string;
  height?: string;
}

const AuthorUserGrid: React.FC<Props> = ({ authorId, height = "300px" }) => {
  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "user_id", caption: "이메일" },
    { dataField: "user_nm", caption: "이름" },
    { dataField: "company_nm", caption: "회사" },
  ];

  return (
    <DetailGridPanel
      key={authorId + "_user"}
      fetchGrid={async () => {
        const result = await selectAuthorUsers(authorId);
        if (!result) return null;
        const items = result.authorUsers.map((u) => ({
          user_id: u.user_id,
          user_nm: u.user_nm,
          company_nm: (u as any).company_nm ?? "",
          use_at: u.use_at === "Y" && u.appr_at === "Y" ? "Y" : "N",
        }));
        return { items, total_count: items.length };
      }}
      columns={GRID_COLUMNS}
      keyField="user_id"
      showPaging={false}
      clientSidePaging={true}
      editable={false}
      inactiveExpr="use_at"
      height={height}
    />
  );
};

export default React.memo(AuthorUserGrid);
