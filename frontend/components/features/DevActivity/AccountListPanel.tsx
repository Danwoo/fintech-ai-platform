"use client";

import { useMemo } from "react";
import { AccountInfo } from "@/schemas/devActivity/devActivity";

interface Props {
  accounts: AccountInfo[]; // 범위 필터가 적용된 목록 (Container 에서 전달)
  selectedAccount: string | null;
  onSelect: (account: string | null) => void;
}

export function AccountListPanel({ accounts, selectedAccount, onSelect }: Props) {
  const itemClass = (active: boolean) =>
    `px-4 py-2.5 cursor-pointer text-sm truncate transition-colors border-l-4 ${
      active
        ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
        : "border-transparent hover:bg-gray-50 text-gray-700"
    }`;

  // 최근 3개월 이내 활성 / 그 이전(전체) 으로 분리 — 활성 그룹을 위에 구분 표시
  const { recent, older } = useMemo(() => {
    const cut = new Date();
    cut.setMonth(cut.getMonth() - 3);
    const cutoff = cut.toISOString().slice(0, 10); // YYYY-MM-DD
    const recent: AccountInfo[] = [];
    const older: AccountInfo[] = [];
    for (const a of accounts) (a.last_activity && a.last_activity >= cutoff ? recent : older).push(a);
    return { recent, older };
  }, [accounts]);

  const renderItem = (a: AccountInfo) => (
    <div
      key={a.account_id}
      className={itemClass(selectedAccount === a.account_id)}
      onClick={() => onSelect(a.account_id)}
      title={a.last_activity ? `${a.name} · 최근활동 ${a.last_activity}` : a.name}
    >
      {a.name}
    </div>
  );

  const sectionHeader = (label: string, count: number) => (
    <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {label} <span className="text-gray-300">({count})</span>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="text-base font-semibold text-gray-800">계좌·포트폴리오</h3>
        <p className="text-xs text-gray-400 mt-0.5">{accounts.length}개 · 전체</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className={itemClass(selectedAccount === null)} onClick={() => onSelect(null)}>
          전체 (자동 탐색)
        </div>
        {recent.length > 0 && (
          <>
            {sectionHeader("최근 3개월", recent.length)}
            {recent.map(renderItem)}
          </>
        )}
        {older.length > 0 && (
          <>
            {sectionHeader("그 이전", older.length)}
            {older.map(renderItem)}
          </>
        )}
      </div>
    </div>
  );
}
