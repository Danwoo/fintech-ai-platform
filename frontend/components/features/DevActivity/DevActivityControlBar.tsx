"use client";

import { useMemo, type ReactNode } from "react";
import { SelectBox, TagBox, DateRangeBox } from "@/components/shared/ui";
import { ConditionBar } from "@/components/shared/Layout";
import { formatDate } from "@/utils/common/formatters/date";
import { AccountInfo, HolderInfo } from "@/schemas/devActivity/devActivity";

interface Props {
  accounts: AccountInfo[];
  holders: HolderInfo[];
  scope: string; // "all" | "kind:cash" | "kind:margin" | "kind:pension" | "group:<group>"
  assetClass: string; // "all" | "equity" | "bond" | "fund" | "cash"
  holderEmails: string[]; // email 목록
  since: string | null;
  until: string | null;
  onScopeChange: (scope: string) => void;
  onAssetClassChange: (assetClass: string) => void;
  onHoldersChange: (holders: string[]) => void;
  onRangeChange: (since: string | null, until: string | null) => void;
}

const ASSET_CLASS_ITEMS = [
  { id: "all", text: "전체" },
  { id: "equity", text: "주식" },
  { id: "bond", text: "채권" },
  { id: "fund", text: "펀드" },
  { id: "cash", text: "현금성" },
];

const KIND_LABEL: Record<string, string> = { cash: "현금성", margin: "신용", pension: "연금" };

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="font-medium text-sm whitespace-nowrap">{label}</span>
    {children}
  </div>
);

export function DevActivityControlBar({
  accounts,
  holders,
  scope,
  assetClass,
  holderEmails,
  since,
  until,
  onScopeChange,
  onAssetClassChange,
  onHoldersChange,
  onRangeChange,
}: Props) {
  // 계좌 범위 옵션: 전체 / 계좌유형(현금성·신용·연금) 전체 / 개별 그룹
  const scopeItems = useMemo(() => {
    const groups = new Map<string, AccountInfo["kind"]>();
    accounts.forEach((a) => groups.set(a.group, a.kind));
    return [
      { id: "all", text: "전체" },
      { id: "kind:cash", text: "현금성 (전체)" },
      { id: "kind:margin", text: "신용 (전체)" },
      { id: "kind:pension", text: "연금 (전체)" },
      ...[...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, kind]) => ({ id: `group:${name}`, text: `${KIND_LABEL[kind] ?? kind} · ${name}` })),
    ];
  }, [accounts]);

  const holderItems = useMemo(
    () => holders.map((h) => ({ email: h.email, label: `${h.name} (${h.username})` })),
    [holders],
  );

  return (
    <ConditionBar>
      <Field label="계좌">
        <SelectBox
          fieldName="scope"
          value={scope}
          items={scopeItems}
          displayExpr="text"
          valueExpr="id"
          searchEnabled
          width={220}
          onValueChanged={(_f, v) => onScopeChange(v || "all")}
        />
      </Field>
      <Field label="자산군">
        <SelectBox
          fieldName="assetClass"
          value={assetClass}
          items={ASSET_CLASS_ITEMS}
          displayExpr="text"
          valueExpr="id"
          width={220}
          onValueChanged={(_f, v) => onAssetClassChange(v || "all")}
        />
      </Field>
      <Field label="계좌주">
        <TagBox
          fieldName="holders"
          value={holderEmails}
          items={holderItems}
          displayExpr="label"
          valueExpr="email"
          placeholder="전체"
          maxDisplayedTags={2}
          width={220}
          onValueChanged={(_f, v) => onHoldersChange(v || [])}
        />
      </Field>
      <Field label="조회기간">
        <DateRangeBox
          value={[since, until]}
          placeholder="질문에서 자동 추출"
          displayFormat="yyyy-MM-dd"
          type="date"
          onValueChanged={(_f, v) => onRangeChange(formatDate(v[0], "date"), formatDate(v[1], "date"))}
        />
      </Field>
    </ConditionBar>
  );
}
