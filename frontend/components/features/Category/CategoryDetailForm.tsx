"use client";

import { useFormState } from "@/hooks/shared/useFormState";
import { Button, TextBox, SelectBox, NumberBox, TextArea, TabPanel, TabContent } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { Category } from "@/schemas/category/category";
import CategoryProductGrid from "./CategoryProductGrid";

interface Props {
  isNew: boolean;
  initialData: Partial<Category>;
  onSubmit: (data: Category) => Promise<boolean>;
  onCancel?: () => void;
  codeList?: any;
}

export default function CategoryDetailForm({ initialData, isNew, codeList, onSubmit, onCancel }: Props) {
  const { formData, handleFieldChange, getFieldProps, handleSubmit } = useFormState<Category>(initialData);

  const canAccessSubTabs = !isNew && !!formData.category_id?.trim();
  const tabs = [
    { id: "basic", text: "카테고리", icon: "edit" },
    { id: "products", text: "상품", icon: "hierarchy", disabled: !canAccessSubTabs },
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

            <div className="flex-1 overflow-auto">
              <TableGroup title="카테고리 정보">
                <TableRow>
                  <TableCell label="카테고리ID" required>
                    <TextBox
                      fieldName="category_id"
                      value={formData.category_id}
                      readOnly={!isNew}
                      onValueChanged={(_field, value) =>
                        handleFieldChange(
                          "category_id",
                          String(value ?? "")
                            .replace(/\s/g, "")
                            .toLowerCase(),
                        )
                      }
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                  <TableCell label="카테고리명" required>
                    <TextBox
                      fieldName="category_nm"
                      value={formData.category_nm}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="정렬순서" required>
                    <NumberBox
                      fieldName="sort_ordr"
                      value={formData.sort_ordr}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                  <TableCell label="사용여부" required>
                    <SelectBox
                      fieldName="use_at"
                      value={formData.use_at}
                      items={codeList?.useAt}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell label="설명" colSpan={3}>
                    <TextArea
                      fieldName="description"
                      value={formData.description}
                      onValueChanged={handleFieldChange}
                      getFieldProps={getFieldProps}
                      maxLength={1000}
                      height={100}
                    />
                  </TableCell>
                </TableRow>
              </TableGroup>
            </div>
          </div>
        </TabContent>

        <TabContent tabId="products">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-2">
              <div className="flex gap-2 justify-end">
                {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <TableGroup title="상품 목록" mode="flex">
                <TableRow>
                  <TableCell>
                    <CategoryProductGrid
                      categoryId={formData.category_id!}
                      editable={true}
                      height="100%"
                      codeList={codeList}
                    />
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
