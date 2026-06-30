"use client";

import { useRef } from "react";
import { useFormState } from "@/hooks/shared/useFormState";
import {
  Button,
  TextBox,
  SelectBox,
  DateBox,
  NumberBox,
  TextArea,
  FileUploader,
  FileUploaderRef,
} from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { Todo } from "@/schemas/todo/todo";

interface Props {
  isNew: boolean;
  initialData: Partial<Todo>;
  onSubmit: (
    data: Todo & {
      imageFiles?: File[];
      documentFiles?: File[];
      hasExistingImages?: boolean;
      hasExistingDocuments?: boolean;
    },
  ) => Promise<boolean>;
  onCancel?: () => void;
  codeList?: any;
}

export default function TodoDetailForm({ initialData, isNew, codeList, onSubmit, onCancel }: Props) {
  const { formData, handleFieldChange, getFieldProps, handleSubmit } = useFormState<Todo>(initialData);

  const imageUploaderRef = useRef<FileUploaderRef>(null);
  const documentUploaderRef = useRef<FileUploaderRef>(null);

  const handleFormSubmit = async (data: Todo) => {
    return await onSubmit({
      ...data,
      imageFiles: imageUploaderRef.current?.selectFiles() || [],
      hasExistingImages: imageUploaderRef.current?.hasExistingFiles() || false,
      documentFiles: documentUploaderRef.current?.selectFiles() || [],
      hasExistingDocuments: documentUploaderRef.current?.hasExistingFiles() || false,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <div className="flex gap-2 justify-end">
          <Button text="저장" onClick={() => handleSubmit(handleFormSubmit)} />
          {onCancel && !isNew && <Button text="취소" onClick={onCancel} stylingMode="outlined" type="normal" />}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <TableGroup title="기본 정보">
          <TableRow>
            <TableCell label="회원번호" required>
              <TextBox
                fieldName="mber_no"
                value={formData.mber_no}
                readOnly={!isNew}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="이름" required>
              <TextBox
                fieldName="nm"
                value={formData.nm}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="직책">
              <TextBox
                fieldName="rspofc"
                value={formData.rspofc}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>

            <TableCell label="부서">
              <SelectBox
                fieldName="dept"
                value={formData.dept}
                items={codeList.dept}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="생년월일">
              <DateBox
                fieldName="brthdy"
                value={formData.brthdy}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="입사일">
              <DateBox
                fieldName="ecny_de"
                value={formData.ecny_de}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="연봉">
              <NumberBox
                fieldName="anslry"
                value={formData.anslry}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
            <TableCell label="수출실적">
              <NumberBox
                fieldName="xport_acmslt"
                value={formData.xport_acmslt}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="성별">
              <SelectBox
                fieldName="sexdstn"
                value={formData.sexdstn}
                items={codeList.sexdstn}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>

            <TableCell label="혈액형">
              <SelectBox
                fieldName="bdp"
                value={formData.bdp}
                items={codeList.bdp}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          {/* 사진 파일 업로더 */}
          <TableRow>
            <TableCell label="사진" colSpan={3}>
              <FileUploader
                ref={imageUploaderRef}
                atchFileId={initialData.photo_atch_file_id}
                fileType="image"
                multiple={true}
                maxFileCount={5}
                fieldName="imageFiles"
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          {/* 문서 파일 업로더 */}
          <TableRow>
            <TableCell label="문서" colSpan={3} required>
              <FileUploader
                ref={documentUploaderRef}
                atchFileId={initialData.document_atch_file_id}
                fileType="document"
                multiple={true}
                maxFileCount={3}
                fieldName="documentFiles"
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="비고" colSpan={3}>
              <TextArea
                fieldName="rm"
                value={formData.rm}
                onValueChanged={handleFieldChange}
                getFieldProps={getFieldProps}
              />
            </TableCell>
          </TableRow>
        </TableGroup>
      </div>
    </div>
  );
}
