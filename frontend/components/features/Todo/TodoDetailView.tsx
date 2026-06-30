"use client";

import { FileListDisplay, Button } from "@/components/shared/ui";
import { TableRow, TableCell, TableGroup } from "@/components/shared/Layout";
import { formatNumber } from "@/utils/common/formatters";
import { TodoOut } from "@/schemas/todo/todo";

interface Props {
  data: TodoOut;
  onEdit: () => void;
  onDelete?: () => void;
  codeList?: any;
}

export default function TodoDetailView({ data, onEdit, onDelete, codeList }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <div className="flex gap-2 justify-end">
          <Button text="수정" onClick={onEdit} />
          {onDelete && <Button text="삭제" onClick={onDelete} stylingMode="outlined" type="danger" />}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <TableGroup title="기본 정보">
          <TableRow>
            <TableCell label="회원번호">{data.mber_no}</TableCell>
            <TableCell label="이름">{data.nm}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="직책">{data.rspofc}</TableCell>
            <TableCell label="부서명" items={codeList.dept}>
              {data.dept}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell label="생년월일">{data.brthdy}</TableCell>
            <TableCell label="입사일">{data.ecny_de}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="주소" colSpan={3}>
              {[data.zip && `(${data.zip})`, data.adres1, data.adres2].filter(Boolean).join(" ")}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="연봉">{formatNumber(data.anslry)}</TableCell>
            <TableCell label="수출실적">{formatNumber(data.xport_acmslt)}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="성별" items={codeList.sexdstn}>
              {data.sexdstn}
            </TableCell>
            <TableCell label="혈액형" items={codeList.bdp}>
              {data.bdp}
            </TableCell>
          </TableRow>

          {/* 사진 파일 섹션 */}
          <TableRow>
            <TableCell label="사진" colSpan={3}>
              <FileListDisplay atchFileId={data.photo_atch_file_id} />
            </TableCell>
          </TableRow>

          {/* 문서 파일 섹션 */}
          <TableRow>
            <TableCell label="문서" colSpan={3}>
              <FileListDisplay atchFileId={data.document_atch_file_id} />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell label="비고" colSpan={3}>
              <div className="whitespace-pre-wrap leading-relaxed" style={{ minHeight: "80px", verticalAlign: "top" }}>
                {data.rm}
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
      </div>
    </div>
  );
}
