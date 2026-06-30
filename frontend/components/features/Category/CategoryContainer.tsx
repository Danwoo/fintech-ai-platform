"use client";

import { useRef } from "react";
import Splitter, { Item } from "devextreme-react/splitter";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterPanel, DetailPanel } from "@/components/shared/DataPanel";
import { MasterGrid } from "@/components/shared/DataGrid";
import CategoryDetailView from "./CategoryDetailView";
import CategoryDetailForm from "./CategoryDetailForm";
import {
  selectCategoryList,
  selectCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/category/categoryService";
import { useCodeStore } from "@/stores/shared/codeStore";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";

export default function CategoryContainer() {
  const gridRef = useRef<any>(null);
  const { getCode } = useCodeStore();
  const codeList = {
    useAt: getCode("1000"), // 사용여부
  };

  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "category_id", caption: "카테고리ID", width: 120 },
    { dataField: "category_nm", caption: "카테고리명", width: 200 },
    { dataField: "sort_ordr", caption: "정렬순서", width: 90, dataType: "number" },
    {
      dataField: "use_at",
      caption: "사용여부",
      width: 100,
      lookup: {
        dataSource: codeList.useAt,
        displayExpr: "code_nm",
        valueExpr: "code",
      },
    },
    { dataField: "reg_dt", caption: "생성일시", width: 160, dataType: "datetime" },
    { dataField: "mod_dt", caption: "수정일시", width: 160, dataType: "datetime" },
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
    fetchGrid: selectCategoryList,
    fetchData: selectCategory,
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "categories",
  });

  const buttons = useMasterGridActions({
    onCreate: handleCreate,
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  const apiService = {
    select: selectCategory,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <Splitter height="100%" orientation="horizontal" allowKeyboardNavigation={true}>
          <Item size="50%" resizable={true}>
            <MasterPanel title="카테고리 목록" buttons={buttons}>
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
              title="카테고리 정보"
              data={selectedData}
              initialMode={selectedData ? "view" : "create"}
              isSelectLoading={isSelectLoading}
              ViewComponent={CategoryDetailView}
              FormComponent={CategoryDetailForm}
              viewProps={{ codeList }}
              formProps={{ codeList }}
              defaultFormData={{ use_at: "Y", sort_ordr: 1 }}
              onComplete={handleCompleteWithRefresh}
              apiService={apiService}
            />
          </Item>
        </Splitter>
      </div>
    </div>
  );
}
