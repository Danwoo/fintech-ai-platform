// schemas/todo/todo.ts
import { z } from "zod";
import { CommonEntity } from "@/schemas/common/types";
import {
  str,
  date,
  email,
  phone,
  bool,
  files,
  requireFiles,
  Field,
  Optional,
  StrRange,
  PositiveInt,
  object,
} from "@/lib/zod/helpers";

export const TodoSchema = object({
  mber_no: StrRange(5, 5),
  nm: StrRange(2, 200),
  rspofc: Optional(Field({ max_length: 200 }).str()),
  dept: Optional(Field({ max_length: 5 }).str()),
  sexdstn: Optional(Field({ max_length: 5 }).str()),
  bdp: Optional(Field({ max_length: 5 }).str()),
  adres1: Optional(Field({ max_length: 255 }).str()),
  adres2: Optional(Field({ max_length: 255 }).str()),
  zip: Optional(Field({ max_length: 6 }).str()),
  brthdy: Optional(date()),
  ecny_de: Optional(date()),
  anslry: Optional(PositiveInt()),
  xport_acmslt: Optional(Field({ precision: 10, scale: 2 }).numeric()),
  email: Optional(email()),
  phone_number: Optional(phone()),
  photo_atch_file_id: Optional(str()),
  document_atch_file_id: Optional(str()),
  rm: Optional(Field({ max_length: 1300 }).str()),
});

// CRUD 스키마
export const TodoCreateInSchema = TodoSchema.extend({
  imageFiles: Optional(files()),
  documentFiles: files(),
});

export const TodoUpdateInSchema = TodoSchema.omit({ mber_no: true })
  .extend({
    imageFiles: Optional(files()),
    documentFiles: Optional(files()),
    hasExistingImages: Optional(bool()),
    hasExistingDocuments: Optional(bool()),
  })
  .superRefine(requireFiles("documentFiles"));

// 타입 정의
export type Todo = z.infer<typeof TodoSchema>;
export type TodoOut = Todo &
  CommonEntity & {
    adres?: string;
  };
export interface TodosOut {
  items: TodoOut[];
  total_count: number;
}
