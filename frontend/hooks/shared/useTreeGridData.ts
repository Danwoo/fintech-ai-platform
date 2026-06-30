// hooks/shared/useTreeGridData.ts
import { useState, useCallback, useEffect } from "react";
import { getApiErrorMessage } from "@/utils/common/errors";
import { showToast } from "@/components/shared/Feedback";

/**
 * 트리 데이터 변환 함수 타입
 */
export type TreeDataConverter<T> = (data: T) => any[];

/**
 * 트리그리드 데이터 관리를 위한 훅 파라미터
 *
 * @description
 * useMasterGridData, useDetailGridData와 달리 DataSource가 아닌
 * 단순 배열 데이터를 관리합니다. TreeList는 배열 기반으로 동작하기 때문입니다.
 */
interface Params<T> {
  /** 데이터를 가져오는 비동기 함수 */
  fetchData: () => Promise<T | null>;
  /** 가져온 데이터를 트리 구조 배열로 변환하는 함수 */
  convertToTreeData: TreeDataConverter<T>;
  /** 제외할 키 목록 (선택 사항) */
  excludeKeys?: string[];
  /** 의존성 배열 (선택 사항) */
  dependencies?: any[];
  /** 초기 로딩 여부 (기본값: true) */
  autoLoad?: boolean;
}

/**
 * 트리그리드 데이터 관리를 위한 범용 훅
 *
 * @description
 * - useMasterGridData, useDetailGridData와 다르게 DataSource가 아닌 배열 데이터 반환
 * - TreeList는 배열 기반 데이터로 동작하며 페이징이 필요없는 경우가 많음
 * - 데이터 fetch → 필터링 → 트리 변환 로직을 재사용 가능하게 캡슐화
 *
 * @example
 * ```tsx
 * const { treeData, isLoading, refreshGrid } = useTreeGridData({
 *   fetchData: () => readNodeValue({ node_id }),
 *   convertToTreeData: (data) => convertJsonToTreeData(data),
 *   excludeKeys: ['message'],
 *   dependencies: [node_id]
 * });
 * ```
 */
export function useTreeGridData<T>({
  fetchData,
  convertToTreeData,
  excludeKeys = [],
  dependencies = [],
  autoLoad = true,
}: Params<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<T | null>(null);
  const [treeData, setTreeData] = useState<any[]>([]);

  /**
   * 데이터를 로드하고 트리 구조로 변환
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchData();
      if (result) {
        // excludeKeys에 해당하는 필드 제거
        const filteredData = excludeKeys.length > 0 ? filterKeys(result, excludeKeys) : result;
        setRawData(filteredData);
        setTreeData(convertToTreeData(filteredData));
      } else {
        setRawData(null);
        setTreeData([]);
      }
    } catch (error: any) {
      console.error("데이터 로드 실패:", error);
      showToast(getApiErrorMessage(error), "error");
      setRawData(null);
      setTreeData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, convertToTreeData, ...excludeKeys]);

  /**
   * 초기 로딩 및 의존성 변경 시 재로딩
   */
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [...dependencies]);

  /**
   * 그리드 새로고침 (다른 훅들과 일관된 네이밍)
   */
  const refreshGrid = useCallback(() => {
    loadData();
  }, [loadData]);

  /**
   * 트리 데이터 초기화
   */
  const clearData = useCallback(() => {
    setRawData(null);
    setTreeData([]);
  }, []);

  return {
    rawData,
    treeData,
    isLoading,
    refreshGrid,
    clearData,
  } as const;
}

/**
 * 지정된 키를 제거하는 헬퍼 함수
 */
function filterKeys<T>(data: T, excludeKeys: string[]): T {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => filterKeys(item, excludeKeys)) as T;
  }

  const filtered: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!excludeKeys.includes(key)) {
      filtered[key] = typeof value === "object" ? filterKeys(value, excludeKeys) : value;
    }
  });

  return filtered as T;
}

/**
 * JSON 객체를 트리 구조로 변환하는 유틸리티 함수
 *
 * @param obj - 변환할 객체
 * @param keyExpr - 고유 키 필드명 (기본값: "id")
 * @param parentIdExpr - 부모 ID 필드명 (기본값: "parentId")
 * @returns 트리 구조 배열
 */
export function convertJsonToTreeData(obj: any, keyExpr: string = "id", parentIdExpr: string = "parentId"): any[] {
  const result: any[] = [];
  let id = 0;

  const traverse = (value: any, key: string, parentId: number | null) => {
    const currentId = ++id;

    if (value === null) {
      result.push({
        [keyExpr]: currentId,
        [parentIdExpr]: parentId,
        key,
        value: "null",
      });
    } else if (typeof value === "object" && !Array.isArray(value)) {
      result.push({
        [keyExpr]: currentId,
        [parentIdExpr]: parentId,
        key,
        value: "",
      });
      Object.entries(value).forEach(([k, v]) => traverse(v, k, currentId));
    } else if (Array.isArray(value)) {
      result.push({
        [keyExpr]: currentId,
        [parentIdExpr]: parentId,
        key,
        value: "",
      });
      value.forEach((v, idx) => traverse(v, `[${idx}]`, currentId));
    } else {
      result.push({
        [keyExpr]: currentId,
        [parentIdExpr]: parentId,
        key,
        value: String(value),
      });
    }
  };

  Object.entries(obj).forEach(([key, value]) => traverse(value, key, null));
  return result;
}
