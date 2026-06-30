"use client";

import { useRef } from "react";
import Splitter, { Item } from "devextreme-react/splitter";
import { MasterPanel, DetailPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterGrid } from "@/components/shared/DataGrid";
import TodoDetailView from "./TodoDetailView";
import TodoDetailForm from "./TodoDetailForm";
import { selectTodoList, selectTodo, createTodo, updateTodo, deleteTodo } from "@/services/todo/todoService";
import { useCodeStore } from "@/stores/shared/codeStore";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";

export default function TodoContainer() {
  const gridRef = useRef<any>(null);
  const { getCode } = useCodeStore();
  const codeList = {
    dept: getCode("9901"), // 부서
    sexdstn: getCode("9900"), // 성별
    bdp: getCode("9902"), // 혈액형
  };

  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "mber_no", caption: "회원번호", width: 100 },
    { dataField: "nm", caption: "이름", width: 100 },
    { dataField: "brthdy", caption: "생년월일", width: 120, dataType: "date" },
    { dataField: "ecny_de", caption: "입사일", width: 120, dataType: "date" },
    { dataField: "rspofc", caption: "직책", width: 100 },
    {
      dataField: "dept",
      caption: "부서명",
      width: 120,
      lookup: {
        dataSource: codeList.dept,
        displayExpr: "code_nm",
        valueExpr: "code",
      },
    },
    { dataField: "zip", caption: "우편번호", width: 100 },
    { dataField: "adres1", caption: "주소1", minWidth: 150 },
    { dataField: "adres2", caption: "주소2", width: 100 },
    { dataField: "anslry", caption: "연봉", width: 120, dataType: "number" },
    {
      dataField: "sexdstn",
      caption: "성별",
      width: 100,
      lookup: {
        dataSource: codeList.sexdstn,
        displayExpr: "code_nm",
        valueExpr: "code",
      },
    },
    {
      dataField: "bdp",
      caption: "혈액형",
      width: 100,
      lookup: {
        dataSource: codeList.bdp,
        displayExpr: "code_nm",
        valueExpr: "code",
      },
    },
    { dataField: "xport_acmslt", caption: "수출실적", width: 120, dataType: "number" },
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
    fetchGrid: selectTodoList,
    fetchData: selectTodo,
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "download",
  });

  const buttons = useMasterGridActions({
    onCreate: handleCreate,
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  const apiService = {
    select: selectTodo,
    create: createTodo,
    update: updateTodo,
    delete: deleteTodo,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <Splitter height="100%" orientation="horizontal" allowKeyboardNavigation={true}>
          <Item size="60%" resizable={true}>
            <MasterPanel title="회원 목록" buttons={buttons}>
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
              title="회원 정보"
              data={selectedData}
              initialMode={selectedData ? "view" : "create"}
              isSelectLoading={isSelectLoading}
              ViewComponent={TodoDetailView}
              FormComponent={TodoDetailForm}
              viewProps={{ codeList }}
              formProps={{ codeList }}
              onComplete={handleCompleteWithRefresh}
              apiService={apiService}
            />
          </Item>
        </Splitter>
      </div>
    </div>
  );
}
