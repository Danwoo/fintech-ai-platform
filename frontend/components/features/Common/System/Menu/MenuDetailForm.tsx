// components/features/Common/System/Menu/MenuDetailForm.tsx
"use client";

import DevTextBox from "devextreme-react/text-box";
import { useFormState } from "@/hooks/shared/useFormState";
import { Button, TextBox, SelectBox, NumberBox, TabPanel, TabContent } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { Menu, DX_ICONS } from "@/schemas/common/menu";
import { isProtectedMenu } from "@/constants/protected";
import MenuAuthorGrid from "./MenuAuthorGrid";

type ParentOption = { value: string; label: string; use_at: string };

interface Props {
  isNew: boolean;
  initialData: Partial<Menu>;
  onSubmit: (data: Menu) => Promise<boolean>;
  onCancel?: () => void;
  parentOptions?: ParentOption[];
  isSysAdmin?: boolean;
}

const LEVEL_OPTIONS = [
  { value: 1, text: "1 - 폴더" },
  { value: 2, text: "2 - 프로그램" },
];

const USE_AT_OPTIONS = [
  { value: "Y", text: "사용" },
  { value: "N", text: "미사용" },
];

const parentItemRender = (item: ParentOption) => (
  <span style={item.use_at !== "Y" ? { color: "#c4c4c4" } : undefined}>{item.label}</span>
);

const ICON_ITEMS = DX_ICONS.map((name) => ({ name }));

const iconItemRender = (item: { name: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <i className={`dx-icon dx-icon-${item.name}`} style={{ fontSize: 16, width: 20 }} />
    <span>{item.name}</span>
  </div>
);

const iconFieldRender = (item: { name: string } | null) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
    {item && <i className={`dx-icon dx-icon-${item.name}`} style={{ fontSize: 16, width: 20, flexShrink: 0 }} />}
    <DevTextBox defaultValue={item?.name ?? ""} />
  </div>
);

export default function MenuDetailForm({
  initialData,
  isNew,
  onSubmit,
  onCancel,
  parentOptions = [],
  isSysAdmin = false,
}: Props) {
  const isProtected = !isNew && !!(initialData as any).is_protected;
  const { formData, handleFieldChange, getFieldProps, handleSubmit } = useFormState<Menu>(initialData);

  // 신규(메뉴ID 미확정) 일 때는 소속 권한 탭 비활성. 시스템 메뉴는 탭은 열리되 안내 문구만.
  const isSystemMenu = !isNew && isProtectedMenu(formData.menu_id ?? "");
  const tabs = [
    { id: "basic", text: "메뉴 정보", icon: "edit" },
    { id: "authors", text: "소속 권한", icon: "key", disabled: isNew },
  ];

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

            <div className="flex-1 min-h-0 overflow-auto">
              <TableGroup title="메뉴 정보">
                <TableRow>
                  <TableCell label="메뉴ID" required>
                    <TextBox
                      fieldName="menu_id"
                      value={formData.menu_id}
                      readOnly={!isNew}
                      onValueChanged={(_field, value) =>
                        handleFieldChange(
                          "menu_id",
                          String(value ?? "")
                            .replace(/\s/g, "")
                            .toLowerCase(),
                        )
                      }
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                  <TableCell label="메뉴명" required>
                    <TextBox
                      fieldName="menu_nm"
                      value={formData.menu_nm}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="레벨" required>
                    <SelectBox
                      fieldName="menu_level"
                      value={formData.menu_level ?? undefined}
                      items={LEVEL_OPTIONS}
                      displayExpr="text"
                      valueExpr="value"
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      readOnly={!isNew}
                    />
                  </TableCell>
                  <TableCell label="정렬순서" required>
                    <NumberBox
                      fieldName="sort_ordr"
                      value={formData.sort_ordr}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      min={1}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="상위메뉴" required={formData.menu_level === 2}>
                    <SelectBox
                      fieldName="upper_menu_id"
                      value={formData.upper_menu_id ?? undefined}
                      items={parentOptions}
                      displayExpr="label"
                      valueExpr="value"
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      placeholder="선택하세요"
                      readOnly={formData.menu_level === 1 || isProtected}
                      itemRender={parentItemRender}
                    />
                  </TableCell>
                  <TableCell label="사용여부" required>
                    <SelectBox
                      fieldName="use_at"
                      value={formData.use_at}
                      items={USE_AT_OPTIONS}
                      displayExpr="text"
                      valueExpr="value"
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      readOnly={isProtected}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="URL" colSpan={3}>
                    <TextBox
                      fieldName="url"
                      value={formData.url}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      readOnly={formData.menu_level === 1 || !isSysAdmin}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="아이콘" colSpan={3}>
                    <SelectBox
                      fieldName="icon"
                      items={ICON_ITEMS}
                      value={formData.icon ?? undefined}
                      valueExpr="name"
                      displayExpr="name"
                      searchEnabled
                      showClearButton
                      placeholder="-- 선택 --"
                      itemRender={iconItemRender}
                      fieldRender={iconFieldRender}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>
              </TableGroup>
            </div>
          </div>
        </TabContent>

        <TabContent tabId="authors">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-2">
              <div className="flex gap-2 justify-end">
                {onCancel && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <TableGroup title="소속 권한">
                <TableRow>
                  <TableCell colSpan={4}>
                    {isSystemMenu ? (
                      <p className="text-sm text-gray-500 px-1 py-2">
                        시스템 메뉴는 권한별로 부여하지 않습니다. (권한 코드 매핑으로 자동 접근)
                      </p>
                    ) : (
                      <MenuAuthorGrid menuId={formData.menu_id!} editable height="500px" />
                    )}
                  </TableCell>
                </TableRow>
              </TableGroup>
            </div>
          </div>
        </TabContent>
      </TabPanel>
    </div>
  );
}
