// components/features/Common/System/Company/CompanyDetailForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useFormState } from "@/hooks/shared/useFormState";
import { Button, TextBox, SelectBox, TabPanel, TabContent } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { DualSelectGrid } from "@/components/shared/DataGrid";
import { showToast, showMessage } from "@/components/shared/Feedback";
import { getApiErrorMessage } from "@/utils/common/errors";
import { DataGridTypes } from "devextreme-react/data-grid";
import { Company } from "@/schemas/common/company";
import CompanyDomainGrid from "./CompanyDomainGrid";
import { selectCompanyMenus, addCompanyMenu, removeCompanyMenu } from "@/services/common/companyService";
import { isOEM } from "@/utils/common/edition";

interface Props {
  isNew: boolean;
  initialData: Partial<Company>;
  onSubmit: (data: Company) => Promise<boolean>;
  onCancel?: () => void;
}

interface MenuRow {
  menu_id: string;
  menu_nm: string;
  use_at?: string | null;
}

const menuColumns: DataGridTypes.Column[] = [
  { dataField: "menu_id", caption: "메뉴ID" },
  { dataField: "menu_nm", caption: "메뉴명" },
];

export default function CompanyDetailForm({ initialData, isNew, onSubmit, onCancel }: Props) {
  const { formData, handleFieldChange, getFieldProps, handleSubmit } = useFormState<Company>(initialData);

  const [companyMenus, setCompanyMenus] = useState<MenuRow[]>([]);
  const [allMenus, setAllMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedCompanyMenuIds, setSelectedCompanyMenuIds] = useState<string[]>([]);

  const canAccessSubTabs = !isNew && formData.id != null;
  // OEM: 도메인 매핑 미사용 — 탭 숨김
  const tabs = [
    { id: "basic", text: "회사 정보", icon: "edit" },
    ...(isOEM() ? [] : [{ id: "domains", text: "이메일 도메인", icon: "hierarchy", disabled: !canAccessSubTabs }]),
    { id: "menus", text: "메뉴", icon: "menu", disabled: !canAccessSubTabs },
  ];

  const fetchMenus = async () => {
    if (formData.id == null) return;
    const result = await selectCompanyMenus(formData.id);
    if (result) {
      setCompanyMenus(
        result.companyMenus.map((m) => ({
          menu_id: m.menu_id,
          menu_nm: m.menu?.menu_nm ?? m.menu_id,
          use_at: m.menu?.use_at ?? null,
        })),
      );
      setAllMenus(
        result.allMenus
          .filter((m) => m.menu_level === 2)
          .map((m) => ({ menu_id: m.menu_id, menu_nm: m.menu_nm, use_at: m.use_at })),
      );
    }
  };

  useEffect(() => {
    if (isNew || formData.id == null) return;
    const load = async () => {
      setLoading(true);
      await fetchMenus();
      setLoading(false);
    };
    load();
  }, [formData.id]);

  const handleAddMenu = async () => {
    if (selectedMenuIds.length === 0) {
      showToast("추가할 메뉴를 선택해주세요.", "warning");
      return;
    }
    const newIds = selectedMenuIds.filter((id) => !companyMenus.map((m) => m.menu_id).includes(id));
    if (newIds.length === 0) {
      showToast("이미 추가된 메뉴입니다.", "warning");
      return;
    }
    for (const menu_id of newIds) {
      try {
        await addCompanyMenu(formData.id!, menu_id);
      } catch (error) {
        showToast(getApiErrorMessage(error), "error");
      }
    }
    setSelectedMenuIds([]);
    await fetchMenus();
  };

  const handleRemoveMenu = async () => {
    if (selectedCompanyMenuIds.length === 0) {
      showToast("제거할 메뉴를 선택해주세요.", "warning");
      return;
    }
    for (const menu_id of selectedCompanyMenuIds) {
      try {
        await removeCompanyMenu(formData.id!, menu_id);
      } catch (error) {
        showMessage("오류", <div>{getApiErrorMessage(error)}</div>);
        break;
      }
    }
    setSelectedCompanyMenuIds([]);
    await fetchMenus();
  };

  return (
    <div className="h-full">
      <TabPanel items={tabs} defaultTab="basic">
        <TabContent tabId="basic">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-2">
              <div className="flex gap-2 justify-end">
                <Button text="저장" onClick={() => handleSubmit(onSubmit)} />
                {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <TableGroup title="회사 정보">
                <TableRow>
                  <TableCell label="회사ID">
                    <TextBox
                      fieldName="id"
                      value={formData.id != null ? String(formData.id) : ""}
                      readOnly
                      onValueChanged={() => {}}
                    />
                  </TableCell>
                  <TableCell label="회사코드" required>
                    <TextBox
                      fieldName="company_code"
                      value={formData.company_code}
                      readOnly={!isNew}
                      placeholder="예: acme"
                      onValueChanged={(_field, value) =>
                        handleFieldChange(
                          "company_code",
                          String(value ?? "")
                            .replace(/\s/g, "")
                            .toLowerCase(),
                        )
                      }
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="회사명" required>
                    <TextBox
                      fieldName="company_nm"
                      value={formData.company_nm}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                  <TableCell label="사용여부" required>
                    <SelectBox
                      fieldName="use_at"
                      value={formData.use_at}
                      items={[
                        { value: "Y", text: "사용" },
                        { value: "N", text: "미사용" },
                      ]}
                      displayExpr="text"
                      valueExpr="value"
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>
              </TableGroup>
            </div>
          </div>
        </TabContent>

        {!isOEM() && (
          <TabContent tabId="domains">
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 mb-2">
                <div className="flex gap-2 justify-end">
                  {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <TableGroup title="이메일 도메인 목록">
                  <TableRow>
                    <TableCell colSpan={4}>
                      <CompanyDomainGrid companyId={formData.id!} editable={true} height="500px" />
                    </TableCell>
                  </TableRow>
                </TableGroup>
              </div>
            </div>
          </TabContent>
        )}

        <TabContent tabId="menus">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-2">
              <div className="flex gap-2 justify-end">
                {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DualSelectGrid
                title="회사 메뉴 관리"
                leftTitle="전체 메뉴"
                rightTitle="부여된 메뉴"
                leftData={allMenus.filter((m) => !companyMenus.some((cm) => cm.menu_id === m.menu_id))}
                rightData={companyMenus}
                leftColumns={menuColumns}
                rightColumns={menuColumns}
                leftKeyExpr="menu_id"
                rightKeyExpr="menu_id"
                loading={loading}
                fillHeight
                inactiveExpr="use_at"
                onAdd={handleAddMenu}
                onRemove={handleRemoveMenu}
                onLeftSelectionChanged={setSelectedMenuIds}
                onRightSelectionChanged={setSelectedCompanyMenuIds}
              />
            </div>
          </div>
        </TabContent>
      </TabPanel>
    </div>
  );
}
