"use client";

import { useRef } from "react";
import Splitter, { Item } from "devextreme-react/splitter";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterPanel, DetailPanel } from "@/components/shared/DataPanel";
import { MasterGrid } from "@/components/shared/DataGrid";
import WatchlistDetailView from "./WatchlistDetailView";
import WatchlistDetailForm from "./WatchlistDetailForm";
import {
  selectWatchlistList,
  selectWatchlist,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
} from "@/services/watchlist/watchlistService";
import { useCodeStore } from "@/stores/shared/codeStore";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";

export default function WatchlistContainer() {
  const gridRef = useRef<any>(null);
  const { getCode } = useCodeStore();
  const codeList = {
    market: getCode("5000"), // 관심종목 시장
    sector: getCode("5001"), // 관심종목 섹터
    currency: getCode("5002"), // 관심종목 통화
    priority: getCode("5003"), // 관심종목 우선순위
    useAt: getCode("1000"), // 사용여부
  };

  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "ticker", caption: "티커", width: 100 },
    { dataField: "issuer_nm", caption: "종목명", minWidth: 150 },
    {
      dataField: "market",
      caption: "시장",
      width: 100,
      lookup: { dataSource: codeList.market, displayExpr: "code_nm", valueExpr: "code" },
    },
    {
      dataField: "sector",
      caption: "섹터",
      width: 120,
      lookup: { dataSource: codeList.sector, displayExpr: "code_nm", valueExpr: "code" },
    },
    {
      dataField: "currency",
      caption: "통화",
      width: 80,
      lookup: { dataSource: codeList.currency, displayExpr: "code_nm", valueExpr: "code" },
    },
    { dataField: "target_price", caption: "목표가", width: 120, dataType: "number" },
    { dataField: "alert_price", caption: "알림가", width: 120, dataType: "number" },
    {
      dataField: "priority",
      caption: "우선순위",
      width: 90,
      lookup: { dataSource: codeList.priority, displayExpr: "code_nm", valueExpr: "code" },
    },
    {
      dataField: "use_at",
      caption: "사용여부",
      width: 100,
      lookup: { dataSource: codeList.useAt, displayExpr: "code_nm", valueExpr: "code" },
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
    fetchGrid: selectWatchlistList,
    fetchData: selectWatchlist,
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "watchlists",
  });

  const buttons = useMasterGridActions({
    onCreate: handleCreate,
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  const apiService = {
    select: selectWatchlist,
    create: createWatchlist,
    update: updateWatchlist,
    delete: deleteWatchlist,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <Splitter height="100%" orientation="horizontal" allowKeyboardNavigation={true}>
          <Item size="60%" resizable={true}>
            <MasterPanel title="관심종목 목록" buttons={buttons}>
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
              title="관심종목 정보"
              data={selectedData}
              initialMode={selectedData ? "view" : "create"}
              isSelectLoading={isSelectLoading}
              ViewComponent={WatchlistDetailView}
              FormComponent={WatchlistDetailForm}
              viewProps={{ codeList }}
              formProps={{ codeList }}
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
