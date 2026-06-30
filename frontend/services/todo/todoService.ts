import { CreateOut, UpdateOut, DeleteOut } from "@/schemas/common/types";
import { TodoCreateInSchema, TodoUpdateInSchema, TodosOut, TodoOut } from "@/schemas/todo/todo";
import { apiCall } from "@/utils/common/api/client";
import { uploadFiles, deleteAllFiles } from "@/services/common/fileService";
import { handleZodValidationError, validateWithZod } from "@/lib/zod/validation";

const BASE_URL = "/api/external/todo";

/**
 * Todo 목록 조회
 * DevExtreme Grid에서 전달받은 파라미터를 처리하여 서버에 요청
 */
export const selectTodoList = async (params: any): Promise<TodosOut | null> => {
  const queryParams: Record<string, any> = { ...params };

  // DevExtreme 파라미터를 API 호출용 JSON 문자열로 변환
  if (queryParams.filter) queryParams.filter = JSON.stringify(queryParams.filter);
  if (queryParams.sort) queryParams.sort = JSON.stringify(queryParams.sort);

  return apiCall<TodosOut>(BASE_URL, {
    method: "GET",
    params: queryParams,
  });
};

/**
 * Todo 단일 조회
 */
export const selectTodo = async (data: any): Promise<TodoOut | null> => {
  const { mber_no } = data;

  return apiCall<TodoOut>(`${BASE_URL}/${mber_no}`, {
    method: "GET",
  });
};

/**
 * Todo 생성
 * Zod 검증 → 파일 업로드 → API 호출 순서로 처리
 */
export const createTodo = async (data: any): Promise<CreateOut | null> => {
  try {
    const { imageFiles, documentFiles, ...validatedData } = validateWithZod(TodoCreateInSchema, data);

    if (imageFiles?.length) {
      const photoUploadResult = await uploadFiles(imageFiles, validatedData.photo_atch_file_id);
      if (photoUploadResult?.data.atch_file_id) {
        validatedData.photo_atch_file_id = photoUploadResult.data.atch_file_id;
      }
    }

    if (documentFiles?.length) {
      const documentUploadResult = await uploadFiles(documentFiles, validatedData.document_atch_file_id);
      if (documentUploadResult?.data.atch_file_id) {
        validatedData.document_atch_file_id = documentUploadResult.data.atch_file_id;
      }
    }

    return apiCall<CreateOut>(BASE_URL, {
      method: "POST",
      data: validatedData,
    });
  } catch (error) {
    handleZodValidationError(error);
  }
};

/**
 * Todo 수정
 */
export const updateTodo = async (data: any): Promise<UpdateOut | null> => {
  try {
    const { mber_no, ...baseData } = data;
    const { imageFiles, documentFiles, hasExistingImages, hasExistingDocuments, ...validatedData } = validateWithZod(
      TodoUpdateInSchema,
      baseData,
    );

    if (imageFiles?.length) {
      const photoUploadResult = await uploadFiles(imageFiles, validatedData.photo_atch_file_id);
      if (photoUploadResult?.data.atch_file_id) {
        validatedData.photo_atch_file_id = photoUploadResult.data.atch_file_id;
      }
    }

    if (documentFiles?.length) {
      const documentUploadResult = await uploadFiles(documentFiles, validatedData.document_atch_file_id);
      if (documentUploadResult?.data.atch_file_id) {
        validatedData.document_atch_file_id = documentUploadResult.data.atch_file_id;
      }
    }

    return apiCall<UpdateOut>(`${BASE_URL}/${mber_no}`, {
      method: "PUT",
      data: validatedData,
    });
  } catch (error) {
    handleZodValidationError(error);
  }
};

/**
 * Todo 삭제
 * Todo 첨부파일 삭제
 */
export const deleteTodo = async (data: any): Promise<DeleteOut | null> => {
  const { photo_atch_file_id, document_atch_file_id, mber_no } = data;

  try {
    await deleteAllFiles(photo_atch_file_id);
  } catch {
    // 파일 삭제 실패 시 무시 (Todo 삭제는 계속 진행)
  }

  try {
    await deleteAllFiles(document_atch_file_id);
  } catch {
    // 파일 삭제 실패 시 무시 (Todo 삭제는 계속 진행)
  }

  return apiCall<DeleteOut>(`${BASE_URL}/${mber_no}`, {
    method: "DELETE",
  });
};
