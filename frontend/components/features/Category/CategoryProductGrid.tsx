// components/features/Category/CategoryProductGrid.tsx
"use client";

import React from "react";
import { DetailGridPanel } from "@/components/shared/DataPanel";
import { DataGridTypes } from "devextreme-react/data-grid";
import { TextBox, SelectBox, NumberBox, TextArea } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { selectProductList, createProduct, updateProduct, deleteProduct } from "@/services/category/categoryService";
import { Product, ProductOut } from "@/schemas/category/category";

interface Props {
  categoryId: string;
  onSelectionChanged?: (product: ProductOut | null) => void;
  height?: string;
  editable?: boolean;
  codeList?: any;
}

const CategoryProductGrid: React.FC<Props> = ({
  categoryId,
  onSelectionChanged,
  height = "100%",
  editable = false,
  codeList,
}) => {
  const GRID_COLUMNS: DataGridTypes.Column[] = [
    { dataField: "rn", caption: "#", width: 50, dataType: "number", allowSorting: false, allowFiltering: false },
    { dataField: "product_id", caption: "상품ID", width: 100 },
    { dataField: "product_nm", caption: "상품명", width: 180 },
    { dataField: "price", caption: "가격", width: 110, dataType: "number" },
    {
      dataField: "use_at",
      caption: "사용여부",
      width: 100,
      lookup: {
        dataSource: codeList?.useAt,
        displayExpr: "code_nm",
        valueExpr: "code",
      },
    },
    { dataField: "description", caption: "설명", minWidth: 150 },
  ];

  return (
    <DetailGridPanel
      fetchGrid={async (params: any) => await selectProductList({ ...params, category_id: categoryId })}
      columns={GRID_COLUMNS}
      height={height}
      apiService={{
        create: async (data: Product) => {
          await createProduct({ ...data, category_id: categoryId });
        },
        update: async (data: Product) => {
          await updateProduct(data);
        },
        delete: async (data: Product) => {
          await deleteProduct(data);
        },
      }}
      FormComponent={FormComponent}
      formProps={{ codeList }}
      defaultFormData={{ price: 0, use_at: "Y" }}
      editable={editable}
      onSelectionChanged={onSelectionChanged}
    />
  );
};

const FormComponent: React.FC<{
  formData: Partial<Product>;
  modalMode: "create" | "edit";
  onFieldChange: (field: string, value: any) => void;
  getFieldProps: (field: string) => any;
  codeList?: any;
}> = ({ formData, modalMode, onFieldChange, getFieldProps, codeList }) => {
  return (
    <TableGroup title="상품 정보">
      <TableRow>
        <TableCell label="상품ID" required>
          <TextBox
            fieldName="product_id"
            value={formData.product_id}
            readOnly={modalMode === "edit"}
            onValueChanged={onFieldChange}
            getFieldProps={getFieldProps}
          />
        </TableCell>
        <TableCell label="상품명" required>
          <TextBox
            fieldName="product_nm"
            value={formData.product_nm}
            onValueChanged={onFieldChange}
            getFieldProps={getFieldProps}
          />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell label="가격" required>
          <NumberBox
            fieldName="price"
            value={formData.price}
            onValueChanged={onFieldChange}
            getFieldProps={getFieldProps}
          />
        </TableCell>
        <TableCell label="사용여부" required>
          <SelectBox
            fieldName="use_at"
            value={formData.use_at}
            items={codeList?.useAt}
            onValueChanged={onFieldChange}
            getFieldProps={getFieldProps}
          />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell label="설명" colSpan={3}>
          <TextArea
            fieldName="description"
            value={formData.description}
            onValueChanged={onFieldChange}
            getFieldProps={getFieldProps}
            maxLength={1000}
            height={80}
          />
        </TableCell>
      </TableRow>
    </TableGroup>
  );
};

export default React.memo(CategoryProductGrid);
