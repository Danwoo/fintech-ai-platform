// hooks/shared/useSelectGridData.ts
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import type { LoadOptions } from "devextreme/common/data";
import { getApiErrorMessage } from "@/utils/common/errors";
import { showToast } from "@/components/shared/Feedback";

interface Params<T> {
  fetchGrid: (params?: any) => Promise<{ items: T[]; total_count: number } | null>;
  keyField?: string;
  onDataChanged?: () => void;
  dependencies?: any[];
}

export function useSelectGridData<T>({ fetchGrid, keyField = "rn", onDataChanged, dependencies = [] }: Params<T>) {
  const [selectedData, setSelectedData] = useState<T | null>(null);
  const fetchGridRef = useRef(fetchGrid);

  useEffect(() => {
    fetchGridRef.current = fetchGrid;
  }, [fetchGrid]);

  const dataSource = useMemo(() => {
    const store = new CustomStore({
      key: keyField,
      async load(loadOptions: LoadOptions) {
        // keyField 정렬 제외
        if (loadOptions.sort && Array.isArray(loadOptions.sort)) {
          loadOptions.sort = loadOptions.sort.filter((sortItem: any) => sortItem.selector !== keyField);
          if (loadOptions.sort.length === 0) {
            loadOptions.sort = undefined;
          }
        }

        try {
          const response = await fetchGridRef.current(loadOptions);
          if (!response) return { data: [], totalCount: 0 };
          return {
            data: response.items || [],
            totalCount: response.total_count || 0,
          };
        } catch (error: unknown) {
          showToast(getApiErrorMessage(error), "error");
          return { data: [], totalCount: 0 };
        }
      },
    });

    return new DataSource({
      store,
      paginate: true,
      pageSize: 15,
      cacheRawData: false,
    });
  }, [keyField, ...dependencies]);

  const refreshGrid = useCallback((): void => {
    dataSource?.reload();
  }, [dataSource]);

  const handleSelect = useCallback((item: T | null) => {
    setSelectedData(item);
  }, []);

  const handleComplete = useCallback(() => {
    setSelectedData(null);
    dataSource.reload();
    onDataChanged?.();
  }, [dataSource, onDataChanged]);

  const handleClearSelection = useCallback(() => {
    setSelectedData(null);
  }, []);

  return {
    dataSource,
    selectedData,
    handleSelect,
    handleComplete,
    handleClearSelection,
    refreshGrid,
  } as const;
}
