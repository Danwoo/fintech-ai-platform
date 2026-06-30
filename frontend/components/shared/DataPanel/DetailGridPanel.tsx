// components/shared/DataPanel/DetailGridPanel.tsx
"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/shared/ui/Button";
import type { ActionButton } from "@/components/shared/ui";
import { FormModal } from "@/components/shared/Layout";
import { DetailGrid } from "@/components/shared/DataGrid";
import { useDetailGridData } from "@/hooks/shared/useDetailGridData";
import { useDetailGridActions } from "@/hooks/shared/useDetailGridActions";
import { useDetailModal } from "@/hooks/shared/useDetailModal";
import { useFormState } from "@/hooks/shared/useFormState";
import { DataGridTypes } from "devextreme-react/data-grid";
import { getApiErrorMessage } from "@/utils/common/errors";
import { showToast, showMessage } from "@/components/shared/Feedback";

const BUILTIN_CRUD_ICONS = new Set(["plus", "edit", "trash"]);

interface Props<T> {
  fetchGrid: (params?: any) => Promise<{ items: T[]; total_count: number } | null>;
  columns: DataGridTypes.Column[];
  keyField?: string;
  editable?: boolean;
  editMode?: "modal" | "cell" | "row" | "batch" | "form" | "popup";
  clientSidePaging?: boolean;
  showPaging?: boolean;
  height?: string;
  inactiveExpr?: string;
  rowDragging?: DataGridTypes.RowDragging;
  showRefreshButton?: boolean;
  apiService?: {
    create?: (data: T) => Promise<{ message?: string } | void>;
    update?: (data: T) => Promise<{ message?: string } | void>;
    delete?: (data: T) => Promise<{ message?: string } | void>;
  };
  FormComponent?: React.ComponentType<any>;
  defaultFormData?: Partial<T>;
  formProps?: any;
  formWidth?: number | string;
  formHeight?: number | string;
  formMinWidth?: number | string;
  formMinHeight?: number | string;
  formMaxWidth?: number | string;
  formMaxHeight?: number | string;
  extraFormContent?: (props: {
    formData: T;
    onFieldChange: (field: string, value: any) => void;
    isOpen: boolean;
    modalMode: "create" | "edit";
  }) => React.ReactNode;
  customActions?: ActionButton[];
  onSelectionChanged?: (item: T) => void;
  onRowDblClick?: (item: T) => void;
  onDataChanged?: () => void;
  onDataLoaded?: (data: { items: T[]; total_count: number }) => void;
  onLocalUpdate?: (key: unknown, values: Partial<T>) => void;
  selectionMode?: "single" | "multiple";
  selectedRowKeys?: Array<string | number>;
  onSelectedRowKeysChange?: (keys: Array<string | number>, rows: T[]) => void;
  cellVerticalAlign?: "top" | "middle" | "bottom";
}

export interface DetailGridPanelRef {
  refresh: () => void;
}

const DetailGridPanelComponent = <T,>(
  {
    fetchGrid,
    columns,
    keyField = "rn",
    editable = true,
    editMode = "modal",
    clientSidePaging = false,
    showPaging = true,
    height = "100%",
    inactiveExpr,
    rowDragging,
    showRefreshButton = true,
    apiService,
    FormComponent,
    defaultFormData = {},
    formProps = {},
    formWidth = 800,
    formHeight,
    formMinWidth,
    formMinHeight,
    formMaxWidth,
    formMaxHeight = "95vh",
    extraFormContent,
    customActions = [],
    onSelectionChanged,
    onRowDblClick,
    onDataChanged,
    onDataLoaded,
    onLocalUpdate,
    selectionMode = "single",
    selectedRowKeys,
    onSelectedRowKeysChange,
    cellVerticalAlign = "top",
  }: Props<T>,
  ref: React.Ref<DetailGridPanelRef>,
) => {
  const [dataVersion, setDataVersion] = useState(0);

  const handleFetchGrid = useCallback(
    async (params?: any) => {
      const result = await fetchGrid(clientSidePaging ? {} : params);
      if (!result) {
        const emptyResult = { items: [], total_count: 0 };
        onDataLoaded?.(emptyResult);
        return emptyResult;
      }

      if (clientSidePaging) {
        const items = result.items || [];
        const clientResult = { items, total_count: items.length };
        onDataLoaded?.(clientResult);
        return clientResult;
      } else {
        const serverResult = {
          items: result.items || [],
          total_count: result.total_count || 0,
        };
        onDataLoaded?.(serverResult);
        return serverResult;
      }
    },
    [fetchGrid, clientSidePaging, onDataLoaded],
  );

  const handleDataChanged = useCallback(() => {
    if (clientSidePaging) {
      setDataVersion((prev) => prev + 1);
    }
    onDataChanged?.();
  }, [clientSidePaging, onDataChanged]);

  const { dataSource, selectedData, handleSelect, handleComplete } = useDetailGridData({
    fetchGrid: handleFetchGrid,
    onDataChanged: handleDataChanged,
    keyField,
    dependencies: clientSidePaging ? [dataVersion] : undefined,
    onLocalUpdate,
  });

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => handleComplete(),
    }),
    [handleComplete],
  );

  const { isModalOpen, modalMode, openCreateModal, openEditModal, closeModal, getInitialFormData } =
    useDetailModal(selectedData);

  const initialFormData = useMemo(() => getInitialFormData(defaultFormData), [getInitialFormData, defaultFormData]);
  const { formData, handleFieldChange, getFieldProps, handleSubmit, resetForm } = useFormState<T>(initialFormData);

  const initialFormDataRef = useRef(initialFormData);
  useEffect(() => {
    initialFormDataRef.current = initialFormData;
  });

  const prevIsModalOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = prevIsModalOpenRef.current;
    prevIsModalOpenRef.current = isModalOpen;
    if (isModalOpen && !wasOpen) {
      resetForm(initialFormDataRef.current);
    }
  }, [isModalOpen, resetForm]);

  const handleFieldChangeWrapper = useCallback(
    (field: string, value: any) => {
      handleFieldChange(field as keyof T, value);
    },
    [handleFieldChange],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedData || !apiService?.delete) {
      showToast("삭제할 항목을 선택해주세요.", "warning");
      return;
    }

    showMessage("삭제 확인", <div>정말 삭제하시겠습니까?</div>, {
      type: "confirm",
      confirmText: "삭제",
      cancelText: "취소",
      callback: {
        onConfirm: async () => {
          try {
            const result = await apiService.delete!(selectedData);
            showToast(result?.message || "삭제가 완료되었습니다.", "success");
            handleComplete();
          } catch (error) {
            showToast(getApiErrorMessage(error), "error");
          }
        },
      },
    });
  }, [selectedData, apiService, handleComplete]);

  const handleSave = useCallback(() => {
    if (!apiService) return;
    handleSubmit(async (data: T) => {
      try {
        let result: any = null;
        if (modalMode === "create") {
          if (apiService.create) {
            result = await apiService.create(data);
            showToast(result?.message || "등록이 완료되었습니다.", "success");
          } else return false;
        } else {
          if (apiService.update) {
            result = await apiService.update(data);
            showToast(result?.message || "수정이 완료되었습니다.", "success");
          } else return false;
        }
        closeModal();
        handleComplete();
        return true;
      } catch (error: any) {
        if (error?.response?.status === 422) throw error;
        showToast(getApiErrorMessage(error), "error");
        return false;
      }
    });
  }, [handleSubmit, modalMode, apiService, closeModal, handleComplete]);

  const handleSelectionChanged = useCallback(
    (item: T | null) => {
      handleSelect(item);
      if (item && onSelectionChanged) onSelectionChanged(item);
    },
    [handleSelect, onSelectionChanged],
  );

  const buttons = useDetailGridActions({
    onRefresh: handleComplete,
    onCreate: apiService?.create ? openCreateModal : undefined,
    onEdit: apiService?.update ? openEditModal : undefined,
    onDelete: apiService?.delete ? handleDelete : undefined,
    selectedData,
    customActions,
  });

  const gridEditable = editable && editMode !== "modal";

  const visibleButtons = buttons.filter((button) => {
    if (button.visible === false) return false;
    if (BUILTIN_CRUD_ICONS.has(button.icon ?? "")) return editable;
    if (button.icon === "refresh") return editable || showRefreshButton;
    return true; // customActions는 editable 무관하게 표시
  });

  return (
    <div className="detail-grid-container flex flex-col" style={{ height }}>
      {visibleButtons.length > 0 && (
        <div className="flex-shrink-0 flex justify-end items-center mb-3">
          <div className="flex gap-2">
            {visibleButtons.map((button, index) => {
              const { visible, sort: _sort, ...buttonProps } = button;
              return <Button key={index} width={button.width || 40} hint={button.hint} {...buttonProps} />;
            })}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <DetailGrid<T>
          dataSource={dataSource}
          columns={columns}
          height="100%"
          onSelectionChanged={handleSelectionChanged}
          onRowDblClick={onRowDblClick}
          selectedData={selectedData}
          clientSidePaging={clientSidePaging}
          showPaging={showPaging}
          editable={gridEditable}
          editMode={editMode as any}
          rowDragging={rowDragging}
          inactiveExpr={inactiveExpr}
          selectionMode={selectionMode}
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={onSelectedRowKeysChange}
          cellVerticalAlign={cellVerticalAlign}
        />
      </div>

      {editable && editMode === "modal" && apiService && FormComponent && (apiService.create || apiService.update) && (
        <FormModal
          visible={isModalOpen}
          title={modalMode === "create" ? "등록" : "수정"}
          width={formWidth}
          height={formHeight}
          minWidth={formMinWidth}
          minHeight={formMinHeight}
          maxWidth={formMaxWidth}
          maxHeight={formMaxHeight}
          onClose={closeModal}
          onSave={handleSave}
          saveDisabled={(modalMode === "create" && !apiService.create) || (modalMode === "edit" && !apiService.update)}
        >
          {isModalOpen && (
            <FormComponent
              formData={formData}
              modalMode={modalMode}
              onFieldChange={handleFieldChangeWrapper}
              getFieldProps={getFieldProps}
              {...formProps}
            />
          )}
        </FormModal>
      )}

      {extraFormContent?.({
        formData: formData as T,
        onFieldChange: handleFieldChangeWrapper,
        isOpen: isModalOpen,
        modalMode,
      })}
    </div>
  );
};

export const DetailGridPanel = forwardRef(DetailGridPanelComponent) as <T>(
  props: Props<T> & { ref?: React.Ref<DetailGridPanelRef> },
) => React.ReactElement;

(DetailGridPanel as any).displayName = "DetailGridPanel";
