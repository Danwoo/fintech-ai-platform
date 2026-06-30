// hooks/shared/useDetailGridData.ts
import { useState, useCallback, useMemo } from "react";
import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import type { LoadOptions } from "devextreme/common/data";
import { getApiErrorMessage } from "@/utils/common/errors";
import { showToast } from "@/components/shared/Feedback";
import { PAGE_SIZE } from "@/constants/app";

interface Params<T> {
  fetchGrid: (params?: any) => Promise<{ items: T[]; total_count: number } | null>;
  keyField?: string;
  onDataChanged?: () => void;
  dependencies?: any[];
  onLocalUpdate?: (key: unknown, values: Partial<T>) => void;
}

export function useDetailGridData<T>({
  fetchGrid,
  keyField = "rn",
  onDataChanged,
  dependencies = [],
  onLocalUpdate,
}: Params<T>) {
  const [selectedData, setSelectedData] = useState<T | null>(null);

  const dataSource = useMemo(() => {
    const store = new CustomStore({
      key: keyField,

      async load(loadOptions: LoadOptions) {
        if (loadOptions.sort && Array.isArray(loadOptions.sort)) {
          loadOptions.sort = loadOptions.sort.filter((sortItem: any) => sortItem.selector !== keyField);
          if (loadOptions.sort.length === 0) {
            loadOptions.sort = undefined;
          }
        }

        try {
          const response = await fetchGrid(loadOptions);
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

      async update(key: unknown, values: Partial<T>) {
        onLocalUpdate?.(key, values);
        return;
      },
    });

    return new DataSource({
      store,
      paginate: true,
      pageSize: PAGE_SIZE.DETAIL,
      cacheRawData: false,
    });
  }, [fetchGrid, keyField, onLocalUpdate, ...dependencies]);

  const refreshGrid = useCallback(() => {
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

  return {
    dataSource,
    selectedData,
    handleSelect,
    handleComplete,
    refreshGrid,
  } as const;
}
