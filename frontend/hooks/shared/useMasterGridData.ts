// hooks/shared/useMasterGridData.ts
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import ArrayStore from "devextreme/data/array_store";
import type { LoadOptions } from "devextreme/common/data";
import { getApiErrorMessage } from "@/utils/common/errors";
import { showToast } from "@/components/shared/Feedback";

interface Params<T> {
  fetchGrid: (params?: any) => Promise<{ items: T[]; total_count: number } | null>;
  keyField?: string;
  fetchData?: (data: T) => Promise<T | null>;
  onDataChanged?: () => void;
  dependencies?: any[];
  paginate?: boolean;
}

export function useMasterGridData<T>({
  fetchGrid,
  keyField = "rn",
  fetchData,
  onDataChanged,
  dependencies = [],
  paginate = true,
}: Params<T>) {
  const [arrayData, setArrayData] = useState<T[]>([]);
  const reloadTokenRef = useRef(0);

  const loadAll = useCallback(async () => {
    const token = ++reloadTokenRef.current;
    try {
      const response = await fetchGrid({});
      if (token !== reloadTokenRef.current) return;
      setArrayData(response?.items ?? []);
    } catch (error: unknown) {
      showToast(getApiErrorMessage(error), "error");
      if (token === reloadTokenRef.current) setArrayData([]);
    }
  }, [fetchGrid]);

  useEffect(() => {
    if (!paginate) {
      void loadAll();
    }
  }, [paginate, loadAll, ...dependencies]);

  const dataSource = useMemo(() => {
    if (!paginate) {
      return new DataSource({
        store: new ArrayStore({ key: keyField, data: arrayData }),
        paginate: false,
        reshapeOnPush: true,
      });
    }

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
    });

    return new DataSource({
      store,
      paginate: true,
      pageSize: 15,
    });
  }, [fetchGrid, keyField, paginate, arrayData, ...dependencies]);

  const refreshGrid = useCallback((): void => {
    if (!paginate) {
      void loadAll();
    } else {
      dataSource?.reload();
    }
  }, [paginate, loadAll, dataSource]);

  const [selectedData, setSelectedData] = useState<T | null>(null);
  const [isSelectLoading, setIsSelectLoading] = useState<boolean>(false);

  const handleSelect = useCallback((data: T | null) => {
    setSelectedData(data);
  }, []);

  const handleCreate = useCallback((): void => {
    setSelectedData(null);
  }, []);

  const handleComplete = useCallback(
    (item: T | null): void => {
      setSelectedData(item);
      onDataChanged?.();
    },
    [onDataChanged],
  );

  const handleRefresh = useCallback(async () => {
    refreshGrid();
    if (selectedData && fetchData) {
      setIsSelectLoading(true);
      try {
        const latest = await fetchData(selectedData);
        handleComplete(latest);
      } catch (error) {
        showToast(getApiErrorMessage(error), "error");
        handleComplete(null);
      } finally {
        setIsSelectLoading(false);
      }
    } else {
      setIsSelectLoading(false);
    }
  }, [refreshGrid, selectedData, fetchData, handleComplete]);

  const handleCompleteWithRefresh = useCallback(
    (data: T | null, action?: "create" | "update" | "delete"): void => {
      handleComplete(data);
      if (action) refreshGrid();
    },
    [handleComplete, refreshGrid],
  );

  return {
    dataSource,
    selectedData,
    isSelectLoading,
    handleSelect,
    handleCreate,
    handleComplete,
    handleRefresh,
    handleCompleteWithRefresh,
    refreshGrid,
  } as const;
}
