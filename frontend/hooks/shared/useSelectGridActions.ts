// hooks/shared/useSelectGridActions.ts
import { useMemo } from "react";
import type { ActionButton } from "@/components/shared/ui";

/**
 * 선택 그리드 액션 버튼을 관리하는 커스텀 훅
 */
export function useSelectGridActions({
  onRefresh,
  onSelect,
  onClearSelection,
  onCancel,
  selectedData,
  allowClearSelection = false,
  asPopup = false,
  customActions = [],
}: {
  onRefresh?: () => void;
  onSelect?: () => void;
  onClearSelection?: () => void;
  onCancel?: () => void;
  selectedData?: any;
  allowClearSelection?: boolean;
  asPopup?: boolean;
  customActions?: ActionButton[];
}) {
  return useMemo(() => {
    const actions: ActionButton[] = [];

    // 새로고침 버튼
    if (onRefresh) {
      actions.push({
        icon: "refresh",
        type: "normal",
        hint: "새로고침",
        onClick: onRefresh,
        sort: 10,
      });
    }

    // 선택 해제 버튼
    if (allowClearSelection && onClearSelection) {
      actions.push({
        icon: "clear",
        type: "normal",
        hint: "선택 해제",
        onClick: onClearSelection,
        sort: 20,
      });
    }

    // 선택 버튼
    if (onSelect) {
      actions.push({
        icon: "check",
        type: "default",
        hint: "선택",
        onClick: onSelect,
        disabled: !selectedData,
        sort: 30,
      });
    }

    // 취소/닫기 버튼
    if (onCancel) {
      actions.push({
        icon: asPopup ? "close" : "revert",
        type: "normal",
        hint: asPopup ? "닫기" : "취소",
        onClick: onCancel,
        sort: 40,
      });
    }

    return [...actions, ...customActions].sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  }, [onRefresh, onSelect, onClearSelection, onCancel, selectedData, allowClearSelection, asPopup, customActions]);
}
