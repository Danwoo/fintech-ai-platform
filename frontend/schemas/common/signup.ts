import { z } from "zod";
import { object } from "@/lib/zod/helpers";

export const signupSchema = object({
  password: z.string().min(8, "비밀번호 8자리 이상 입력해주세요.").max(72),
  name: z.string().min(1, "이름을 입력해주세요.").max(100),
  dept: z.string().max(50).optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;
