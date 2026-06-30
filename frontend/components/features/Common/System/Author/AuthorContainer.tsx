// components/features/Common/System/Author/AuthorContainer.tsx
"use client";

import { useRef } from "react";
import Splitter, { Item } from "devextreme-react/splitter";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterPanel, DetailPanel } from "@/components/shared/DataPanel";
import { MasterGrid } from "@/components/shared/DataGrid";
import AuthorDetailView from "./AuthorDetailView";
import AuthorDetailForm from "./AuthorDetailForm";
import {
  selectAuthorList,
  selectAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from "@/services/common/authorService";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";

export default function AuthorContainer() {
  const gridRef = useRef<any>(null);

  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "author_id", caption: "권한ID", width: 200 },
    { dataField: "author_nm", caption: "권한명", minWidth: 150 },
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
    fetchGrid: selectAuthorList,
    fetchData: selectAuthor,
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "authors",
  });

  // 권한관리는 시스템관리자 전용 메뉴 — 등록/수정/삭제 모두 허용.
  const buttons = useMasterGridActions({
    onCreate: handleCreate,
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  const apiService = {
    select: selectAuthor,
    create: createAuthor,
    update: updateAuthor,
    delete: deleteAuthor,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <Splitter height="100%" orientation="horizontal" allowKeyboardNavigation={true}>
          <Item size="60%" resizable={true}>
            <MasterPanel title="권한 목록" buttons={buttons}>
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
              title="권한 정보"
              data={selectedData}
              initialMode={selectedData ? "view" : "create"}
              isSelectLoading={isSelectLoading}
              ViewComponent={AuthorDetailView}
              FormComponent={AuthorDetailForm}
              formProps={{}}
              onComplete={handleCompleteWithRefresh}
              apiService={apiService}
            />
          </Item>
        </Splitter>
      </div>
    </div>
  );
}
