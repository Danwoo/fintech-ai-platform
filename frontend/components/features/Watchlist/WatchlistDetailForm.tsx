"use client";

import { useFormState } from "@/hooks/shared/useFormState";
import { Button, TextBox, SelectBox, NumberBox, TextArea } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { Watchlist } from "@/schemas/watchlist/watchlist";

interface Props {
  isNew: boolean;
  initialData: Partial<Watchlist>;
  onSubmit: (data: Watchlist) => Promise<boolean>;
  onCancel?: () => void;
  codeList?: any;
}

export default function WatchlistDetailForm({ initialData, isNew, codeList, onSubmit, onCancel }: Props) {
  const { formData, handleFieldChange, getFieldProps, handleSubmit } = useFormState<Watchlist>(initialData);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <div className="flex gap-2 justify-end">
          <Button text="저장" onClick={() => handleSubmit(onSubmit)} />
          {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <TableGroup title="기본 정보">
          <TableRow>
            <TableCell label="티커" required>
              <TextBox
                fieldName="ticker"
                value={formData.ticker}
                readOnly={!isNew}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="종목명">
              <TextBox
                fieldName="issuer_nm"
                value={formData.issuer_nm}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="시장">
              <SelectBox
                fieldName="market"
                value={formData.market}
                items={codeList?.market}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="섹터">
              <SelectBox
                fieldName="sector"
                value={formData.sector}
                items={codeList?.sector}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="통화">
              <SelectBox
                fieldName="currency"
                value={formData.currency}
                items={codeList?.currency}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="우선순위">
              <SelectBox
                fieldName="priority"
                value={formData.priority}
                items={codeList?.priority}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="목표가">
              <NumberBox
                fieldName="target_price"
                value={formData.target_price}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="알림가">
              <NumberBox
                fieldName="alert_price"
                value={formData.alert_price}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
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
            <TableCell label="비고" colSpan={3}>
              <TextArea
                fieldName="memo"
                value={formData.memo}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
                maxLength={1300}
                height={100}
              />
            </TableCell>
          </TableRow>
        </TableGroup>
      </div>
    </div>
  );
}
