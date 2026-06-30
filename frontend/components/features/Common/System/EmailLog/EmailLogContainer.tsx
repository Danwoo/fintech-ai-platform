"use client";

import { useRef } from "react";
import { DataGridTypes } from "devextreme-react/data-grid";
import { MasterPanel } from "@/components/shared/DataPanel";
import { MasterGrid } from "@/components/shared/DataGrid";
import { selectEmailLogList } from "@/services/common/emailLogService";
import { useMasterGridData } from "@/hooks/shared/useMasterGridData";
import { useExcelExport } from "@/hooks/shared/useExcelExport";
import { useMasterGridActions } from "@/hooks/shared/useMasterGridActions";

const GRID_COLUMNS: DataGridTypes.Column[] = [
  { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
  { dataField: "to", caption: "수신자", width: 160 },
  { dataField: "subject", caption: "제목", width: 220 },
  {
    dataField: "status",
    caption: "상태",
    width: 80,
    lookup: {
      dataSource: [
        { value: "SUCCESS", text: "성공" },
        { value: "FAIL", text: "실패" },
      ],
      displayExpr: "text",
      valueExpr: "value",
    },
  },
  { dataField: "error_msg", caption: "에러 메시지", minWidth: 160 },
  { dataField: "reg_dt", caption: "발송일시", width: 160 },
];

export default function EmailLogContainer() {
  const gridRef = useRef<any>(null);

  const { dataSource, handleRefresh } = useMasterGridData({
    fetchGrid: selectEmailLogList,
    keyField: "id",
  });

  const { handleExcelDownload } = useExcelExport({
    gridRef,
    columns: GRID_COLUMNS,
    fileName: "email_log",
  });

  const buttons = useMasterGridActions({
    onRefresh: handleRefresh,
    onExcelDownload: handleExcelDownload,
    customActions: [],
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 border-t">
        <MasterPanel title="이메일 발송 로그" buttons={buttons}>
          <MasterGrid ref={gridRef} dataSource={dataSource} columns={GRID_COLUMNS} />
        </MasterPanel>
      </div>
    </div>
  );
}
