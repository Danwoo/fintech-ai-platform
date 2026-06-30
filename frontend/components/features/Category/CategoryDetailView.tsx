"use client";

import { Button } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import CategoryProductGrid from "./CategoryProductGrid";
import { CategoryOut } from "@/schemas/category/category";

interface Props {
  data: CategoryOut;
  onEdit: () => void;
  onDelete?: () => void;
  codeList?: any;
}

export default function CategoryDetailView({ data, onEdit, onDelete, codeList }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <div className="flex gap-2 justify-end">
          <Button text="수정" onClick={onEdit} />
          {onDelete && <Button text="삭제" onClick={onDelete} stylingMode="outlined" type="danger" />}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <TableGroup title="카테고리 정보">
          <TableRow>
            <TableCell label="카테고리ID">{data.category_id}</TableCell>
            <TableCell label="카테고리명">{data.category_nm}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="정렬순서">{data.sort_ordr}</TableCell>
            <TableCell label="사용여부" items={codeList?.useAt}>
              {data.use_at}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="설명" colSpan={3}>
              <div className="whitespace-pre-wrap leading-relaxed" style={{ minHeight: "40px", verticalAlign: "top" }}>
                {data.description}
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="생성일시">{data.reg_dt}</TableCell>
            <TableCell label="생성자">{data.reg_id}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="수정일시">{data.mod_dt}</TableCell>
            <TableCell label="수정자">{data.mod_id}</TableCell>
          </TableRow>
        </TableGroup>

        <TableGroup title="상품 목록">
          <TableRow>
            <TableCell colSpan={4}>
              <CategoryProductGrid categoryId={data.category_id} editable={false} height="500px" codeList={codeList} />
            </TableCell>
          </TableRow>
        </TableGroup>
      </div>
    </div>
  );
}
