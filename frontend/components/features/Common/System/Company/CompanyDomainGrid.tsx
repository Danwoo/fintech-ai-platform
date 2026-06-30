// components/features/Common/System/Company/CompanyDomainGrid.tsx
"use client";

import React from "react";
import { DetailGridPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { TextBox } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { selectCompanyDomainList, createCompanyDomain, deleteCompanyDomain } from "@/services/common/companyService";
import { CompanyDomain } from "@/schemas/common/company";

interface Props {
  companyId: number;
  height?: string;
  editable?: boolean;
}

const CompanyDomainGrid: React.FC<Props> = ({ companyId, height = "100%", editable = true }) => {
  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "domain", caption: "도메인" },
    { dataField: "reg_dt", caption: "생성일시", width: 160, dataType: "datetime" },
  ];

  return (
    <DetailGridPanel
      fetchGrid={async (params: any) => {
        return await selectCompanyDomainList({ ...params, company_id: companyId });
      }}
      columns={GRID_COLUMNS}
      keyField="domain"
      height={height}
      apiService={{
        create: async (data: CompanyDomain) => {
          await createCompanyDomain({ ...data, company_id: companyId });
        },
        delete: async (data: CompanyDomain) => {
          await deleteCompanyDomain({ ...data, company_id: companyId });
        },
      }}
      FormComponent={FormComponent}
      editable={editable}
    />
  );
};

const FormComponent: React.FC<{
  formData: Partial<CompanyDomain>;
  modalMode: "create" | "edit";
  onFieldChange: (field: string, value: any) => void;
  getFieldProps: (field: string) => any;
}> = ({ formData, modalMode, onFieldChange, getFieldProps }) => {
  return (
    <TableGroup title="도메인 정보">
      <TableRow>
        <TableCell label="도메인" required colSpan={3}>
          <TextBox
            fieldName="domain"
            value={formData.domain}
            readOnly={modalMode === "edit"}
            placeholder="예: example.com"
            onValueChanged={(_field, value) =>
              onFieldChange(
                "domain",
                String(value ?? "")
                  .toLowerCase()
                  .trim(),
              )
            }
            getFieldProps={getFieldProps}
          />
        </TableCell>
      </TableRow>
    </TableGroup>
  );
};

export default React.memo(CompanyDomainGrid);
