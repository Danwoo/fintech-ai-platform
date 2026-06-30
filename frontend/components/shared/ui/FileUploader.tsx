// components/shared/ui/FileUploader.tsx
"use client";

import React, { useCallback, useState, forwardRef, useImperativeHandle, useMemo, useEffect } from "react";
import DevFileUploader from "devextreme-react/file-uploader";
import type { ValueChangedEvent } from "devextreme/ui/file_uploader";
import { Button } from "@/components/shared/ui/Button";
import { showToast, showMessage } from "@/components/shared/Feedback";
import { getApiErrorMessage } from "@/utils/common/errors";
import { FileDetail } from "@/schemas/common/file";
import { deleteFile } from "@/services/common/fileService";
import { useFileGroups } from "@/hooks/shared/useFileGroups";
import { formatFileSize } from "@/utils/common/fileUtils";

interface Props {
  atchFileId?: string;
  multiple?: boolean;
  maxFileSize?: number;
  maxFileCount?: number;
  allowedFileExtensions?: string[];
  selectButtonText?: string;
  labelText?: string;
  fileType?: "image" | "document" | "all";
  fieldName?: string;
  getFieldProps?: (fieldName: string) => any;
  onFilesChanged?: (files: File[]) => void;
  showFileList?: boolean;
}

export interface FileUploaderRef {
  selectFiles: () => File[];
  clearFiles: () => void;
  removeFile: (index: number) => void;
  hasExistingFiles: () => boolean;
}

/**
 * 파일 확장자별 아이콘 컴포넌트
 */
const FileIcon: React.FC<{ extension: string; fileName: string }> = ({ extension, fileName }) => {
  let ext = extension?.toLowerCase() || "";

  if (!ext && fileName) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex > 0) {
      ext = fileName.substring(lastDotIndex + 1).toLowerCase();
    }
  }

  ext = ext.replace(".", "");

  const iconMap: Record<string, string> = {
    pdf: "dx-icon-file text-red-500",
    doc: "dx-icon-doc text-blue-600",
    docx: "dx-icon-doc text-blue-600",
    xls: "dx-icon-xlsfile text-green-600",
    xlsx: "dx-icon-xlsfile text-green-600",
    ppt: "dx-icon-file text-orange-500",
    pptx: "dx-icon-file text-orange-500",
    txt: "dx-icon-doc text-gray-600",
    rtf: "dx-icon-doc text-gray-600",
    zip: "dx-icon-folder text-purple-600",
    rar: "dx-icon-folder text-purple-600",
    "7z": "dx-icon-folder text-purple-600",
    tar: "dx-icon-folder text-purple-600",
    gz: "dx-icon-folder text-purple-600",
    parquet: "dx-icon-xlsfile text-indigo-600",
    jpg: "dx-icon-image text-blue-500",
    jpeg: "dx-icon-image text-blue-500",
    png: "dx-icon-image text-blue-500",
    gif: "dx-icon-image text-blue-500",
    bmp: "dx-icon-image text-blue-500",
    webp: "dx-icon-image text-blue-500",
    csv: "dx-icon-xlsfile text-green-600",
  };

  const iconClass = iconMap[ext] || "dx-icon-file text-gray-400";
  return <i className={`${iconClass} text-xl`}></i>;
};

/**
 * 파일 업로더 컴포넌트
 */
export const FileUploader = forwardRef<FileUploaderRef, Props>(
  (
    {
      atchFileId,
      multiple = false,
      maxFileSize = 1024 * 1024 * 1024,
      maxFileCount,
      allowedFileExtensions,
      selectButtonText = "파일 선택",
      labelText,
      fileType = "all",
      fieldName,
      getFieldProps,
      onFilesChanged,
      showFileList: showFileListProp = true,
    },
    ref,
  ) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
    const [currentFileDetails, setCurrentFileDetails] = useState<FileDetail[]>([]);

    const fileGroupsConfig = useMemo(() => (atchFileId ? [{ key: "files", fileId: atchFileId }] : []), [atchFileId]);
    const fileGroups = useFileGroups(fileGroupsConfig);

    useEffect(() => {
      if (fileGroups.files?.files) {
        setCurrentFileDetails(fileGroups.files.files);
      }
    }, [fileGroups.files?.files]);

    const effectiveMaxFileCount = useMemo(() => {
      if (!multiple) return 1;
      return maxFileCount ?? Infinity;
    }, [multiple, maxFileCount]);

    const canAddMore = useMemo(() => {
      return currentFileDetails.length + selectedFiles.length < effectiveMaxFileCount;
    }, [currentFileDetails.length, selectedFiles.length, effectiveMaxFileCount]);

    const getFileTypeSettings = useCallback(() => {
      if (allowedFileExtensions && allowedFileExtensions.length > 0) {
        return {
          accept: allowedFileExtensions.join(","),
          allowedFileExtensions,
          labelText: labelText || "파일을 드래그하거나 클릭하세요",
        };
      }

      const extensionMap: Record<string, string[]> = {
        image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
        document: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".parquet"],
        all: [],
      };

      const labelMap: Record<string, string> = {
        image: "이미지 파일을 드래그하거나 클릭하세요",
        document: "문서 파일을 드래그하거나 클릭하세요",
        all: "파일을 드래그하거나 클릭하세요",
      };

      const extensions = extensionMap[fileType] || extensionMap.all;

      return {
        accept: extensions.length > 0 ? extensions.join(",") : "*",
        allowedFileExtensions: extensions,
        labelText: labelText || labelMap[fileType] || labelMap.all,
      };
    }, [allowedFileExtensions, labelText, fileType]);

    const fileSettings = useMemo(() => getFileTypeSettings(), [getFileTypeSettings]);

    useImperativeHandle(ref, () => ({
      selectFiles: () => selectedFiles,
      clearFiles: () => {
        setSelectedFiles([]);
        onFilesChanged?.([]);
      },
      removeFile: (index: number) => {
        const updated = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updated);
        onFilesChanged?.(updated);
      },
      hasExistingFiles: () => currentFileDetails.length > 0,
    }));

    const handleValueChanged = useCallback(
      (e: ValueChangedEvent) => {
        const files = e.value ? (Array.from(e.value) as File[]) : [];

        if (files.length === 0) {
          setSelectedFiles([]);
          onFilesChanged?.([]);
          return;
        }

        const totalCount = currentFileDetails.length + files.length;

        if (totalCount > effectiveMaxFileCount) {
          const allowedNewFiles = Math.max(0, effectiveMaxFileCount - currentFileDetails.length);
          const limitedFiles = files.slice(0, allowedNewFiles);
          setSelectedFiles(limitedFiles);
          onFilesChanged?.(limitedFiles);
          if (limitedFiles.length < files.length) {
            showToast(`최대 ${effectiveMaxFileCount}개까지만 업로드할 수 있습니다.`, "warning");
          }
        } else {
          setSelectedFiles(files);
          onFilesChanged?.(files);
        }
      },
      [currentFileDetails.length, effectiveMaxFileCount, onFilesChanged],
    );

    const handleDeleteFile = useCallback((file: FileDetail) => {
      showMessage("삭제 확인", <div>파일을 삭제하시겠습니까?</div>, {
        type: "confirm",
        confirmText: "삭제",
        cancelText: "취소",
        callback: {
          onConfirm: async () => {
            setDeletingFiles((prev) => new Set(prev).add(file.file_sn));
            try {
              await deleteFile(file.atch_file_id, file.file_sn);
              showToast("파일이 삭제되었습니다.", "success");
              setCurrentFileDetails((prev) => prev.filter((f) => f.file_sn !== file.file_sn));
            } catch (error) {
              showToast(getApiErrorMessage(error), "error");
            } finally {
              setDeletingFiles((prev) => {
                const newSet = new Set(prev);
                newSet.delete(file.file_sn);
                return newSet;
              });
            }
          },
        },
      });
    }, []);

    const fieldPropsData = fieldName && getFieldProps ? getFieldProps(fieldName) : {};

    return (
      <div className="w-full">
        {currentFileDetails.length > 0 && (
          <div className="mb-4">
            <div className="space-y-2">
              {currentFileDetails.map((file) => (
                <div key={file.file_sn} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <FileIcon extension={file.file_extsn || ""} fileName={file.orignl_file_nm || ""} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{file.orignl_file_nm}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(file.file_mg || 0)}</div>
                    </div>
                  </div>
                  <Button
                    text="삭제"
                    onClick={() => handleDeleteFile(file)}
                    stylingMode="outlined"
                    type="danger"
                    width="auto"
                    height={28}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {isFinite(effectiveMaxFileCount) && (
          <div className="mb-2">
            <div className="text-sm font-medium text-gray-700">
              추가 업로드 ({currentFileDetails.length + selectedFiles.length}/{effectiveMaxFileCount})
              {fileSettings.allowedFileExtensions.length > 0 && (
                <span className="ml-2 text-[10px] text-gray-400">
                  (허용형식: {fileSettings.allowedFileExtensions.join(", ")})
                </span>
              )}
            </div>
          </div>
        )}

        <div className={`file-uploader-container ${!canAddMore ? "upload-disabled" : ""}`}>
          <DevFileUploader
            multiple={multiple}
            accept={fileSettings.accept}
            maxFileSize={maxFileSize}
            allowedFileExtensions={fileSettings.allowedFileExtensions}
            selectButtonText={canAddMore ? selectButtonText : "최대 개수 도달"}
            labelText={
              canAddMore
                ? fileSettings.labelText
                : isFinite(effectiveMaxFileCount)
                  ? `최대 ${effectiveMaxFileCount}개까지만 업로드할 수 있습니다.`
                  : "최대 개수 도달"
            }
            showFileList={showFileListProp}
            uploadMode="useButtons"
            onValueChanged={handleValueChanged}
            uploadUrl=""
            {...fieldPropsData}
          />
        </div>

        {!isFinite(effectiveMaxFileCount) && fileSettings.allowedFileExtensions.length > 0 && (
          <div className="mt-1">
            <span className="text-xs text-gray-500">타입: {fileSettings.allowedFileExtensions.join(", ")}</span>
          </div>
        )}

        <style jsx>{`
          .file-uploader-container :global(.dx-fileuploader-upload-button) {
            display: none !important;
          }
          .file-uploader-container :global(.dx-fileuploader-files-container) {
            padding: 0 !important;
          }
          .file-uploader-container :global(.dx-fileuploader-input-label) {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            max-width: none !important;
          }
          .upload-disabled :global(.dx-fileuploader-input-wrapper),
          .upload-disabled :global(.dx-fileuploader-input-label) {
            pointer-events: none !important;
            opacity: 0.6;
            cursor: not-allowed;
          }
          .upload-disabled :global(.dx-fileuploader-file .dx-button),
          .upload-disabled :global(.dx-icon-close) {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
        `}</style>
      </div>
    );
  },
);

FileUploader.displayName = "FileUploader";
