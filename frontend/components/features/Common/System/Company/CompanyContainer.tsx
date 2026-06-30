// components/features/Common/System/Company/CompanyContainer.tsx
"use client";

import { useRef } from "react";
import Splitter, { Item } from "devextreme-react/splitter";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterPanel, DetailPanel } from "@/components/shared/DataPanel";
import { MasterGrid } from "@/components/shared/DataGrid";
import CompanyDetailView from "./CompanyDetailView";
import CompanyDetailForm from "./CompanyDetailForm";
import { selectCompanyList, selectCompany, createCompany, updateCompany } from "@/services/common/companyService";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";
import { isOEM } from "@/utils/common/edition";

export default function CompanyContainer() {
  const gridRef = useRef<any>(null);

  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "id", caption: "회사ID", width: 80, dataType: "number" },
    { dataField: "company_code", caption: "회사코드", width: 150 },
    { dataField: "company_nm", caption: "회사명", minWidth: 200 },
    {
      dataField: "use_at",
      caption: "사용여부",
      width: 100,
      lookup: {
        dataSource: [
          { value: "Y", text: "사용" },
          { value: "N", text: "미사용" },
        ],
        displayExpr: "text",
        valueExpr: "value",
      },
    },
    { dataField: "reg_dt", caption: "생성일시", width: 160, dataType: "datetime" },
    { dataField: "reg_id", caption: "생성자ID", width: 100 },
    { dataField: "mod_dt", caption: "수정일시", width: 160, dataType: "datetime" },
    { dataField: "mod_id", caption: "수정자ID", width: 100 },
  ];

  const {
    dataSource,
    selectedData,
    isSelectLoading,
    handleSelect,
    handleCreate,
    handleRefresh,
    handleCompleteWithRefresh,
  } = useMasterGridData({
    fetchGrid: selectCompanyList,
    keyField: "id",
    fetchData: selectCompany,
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "companies",
  });

  const buttons = useMasterGridActions({
    // OEM: 회사는 정확히 1개여야 함(signup 불변식). 추가 생성 차단 위해 등록 버튼 숨김.
    onCreate: isOEM() ? undefined : handleCreate,
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  // delete 없음: 회사는 영구 보존, 폐쇄 시 use_at='N' 으로 soft delete
  const apiService = {
    select: selectCompany,
    create: createCompany,
    update: updateCompany,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <Splitter height="100%" orientation="horizontal" allowKeyboardNavigation={true}>
          <Item size="60%" resizable={true}>
            <MasterPanel title="회사 목록" buttons={buttons}>
              <MasterGrid
                ref={gridRef}
                dataSource={dataSource}
                columns={GRID_COLUMNS}
                onSelectionChanged={handleSelect}
                selectedData={selectedData}
              />
            </MasterPanel>
          </Item>

          <Item resizable={true}>
            <DetailPanel
              title="회사 정보"
              data={selectedData}
              initialMode={selectedData ? "view" : "create"}
              isSelectLoading={isSelectLoading}
              ViewComponent={CompanyDetailView}
              FormComponent={CompanyDetailForm}
              formProps={{}}
              defaultFormData={{ use_at: "Y" }}
              onComplete={handleCompleteWithRefresh}
              apiService={apiService}
            />
          </Item>
        </Splitter>
      </div>
    </div>
  );
}
