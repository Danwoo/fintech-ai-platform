// lib/zod/helpers.ts
import { z } from "zod";
import "@/utils/common/locale"; // 앱 i18n locale 부트스트랩 (DevExtreme + Zod)

/**
 * Zod 헬퍼 라이브러리
 * Zod를 몰라도 헬퍼만으로 모든 유효성 검증 가능
 */

// ================================
// 기본 타입 (9개)
// ================================
export const str = (min_length = 1) => z.string().trim().min(min_length);
export const int = () => z.number().int();
export const float = () => z.number();
export const bool = () => z.boolean();
export const date = () =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/);
export const phone = () =>
  z
    .string()
    .trim()
    .regex(/^01[0-9]-\d{3,4}-\d{4}$/);
export const email = () => z.email().trim();
export const url = () => z.url().trim();
export const uuid = () => z.uuid();
/** 호스트네임(도메인) 형식 — 프로토콜/경로/@ 비포함. 예: example.com, partner.example.com */
export const domain = (max = 100) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(max)
    .regex(
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/,
      "올바른 도메인 형식이 아닙니다",
    );

// ================================
// 핵심 패턴 (2개)
// ================================
/** Optional 처리: 빈값을 undefined로 변환, 문자열 타입 자동변환 */
export const Optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    if (Array.isArray(val) && val.length === 0) return undefined;

    const getType = (s: any): string =>
      s._def.typeName || s._def.innerType?.typeName || s._def.schema?._def.typeName || "unknown";
    const type = getType(schema);

    if (type === "ZodNumber" && typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }
    if (type === "ZodBoolean" && typeof val === "string") {
      if (val.toLowerCase() === "true") return true;
      if (val.toLowerCase() === "false") return false;
      return undefined;
    }
    return val;
  }, schema.optional());

/** 제약조건 통합 필드 생성기 */
export const Field = (constraints: {
  min_length?: number;
  max_length?: number;
  pattern?: RegExp;
  ge?: number;
  le?: number;
  gt?: number;
  lt?: number;
  gte?: number;
  lte?: number;
  precision?: number;
  scale?: number;
  min_items?: number;
  max_items?: number;
}) => ({
  str: () => {
    let s = z.string().trim();
    if (constraints.min_length !== undefined) s = s.min(constraints.min_length);
    if (constraints.max_length !== undefined) s = s.max(constraints.max_length);
    if (constraints.pattern) s = s.regex(constraints.pattern);
    return s;
  },
  int: () => {
    let s = z.number().int();
    if (constraints.ge !== undefined) s = s.gte(constraints.ge);
    if (constraints.le !== undefined) s = s.lte(constraints.le);
    if (constraints.gt !== undefined) s = s.gt(constraints.gt);
    if (constraints.lt !== undefined) s = s.lt(constraints.lt);
    if (constraints.gte !== undefined) s = s.gte(constraints.gte);
    if (constraints.lte !== undefined) s = s.lte(constraints.lte);
    return s;
  },
  float: () => {
    let s = z.number();
    if (constraints.ge !== undefined) s = s.gte(constraints.ge);
    if (constraints.le !== undefined) s = s.lte(constraints.le);
    if (constraints.gt !== undefined) s = s.gt(constraints.gt);
    if (constraints.lt !== undefined) s = s.lt(constraints.lt);
    if (constraints.gte !== undefined) s = s.gte(constraints.gte);
    if (constraints.lte !== undefined) s = s.lte(constraints.lte);
    return s;
  },
  numeric: () => {
    const precision = constraints.precision || 10;
    const scale = constraints.scale || 0;
    return z.number().refine((value) => {
      const valueStr = Math.abs(value).toString();
      const [intPart, decPart = ""] = valueStr.split(".");
      const intDigits = intPart === "0" ? 0 : intPart.length;
      const scaleDigits = decPart.length;
      return intDigits + scaleDigits <= precision && scaleDigits <= scale;
    });
  },
});

// ================================
// 범위 패턴 (6개)
// ================================
export const StrRange = (min: number, max: number) => Field({ min_length: min, max_length: max }).str();
export const IntRange = (min: number, max: number) => Field({ ge: min, le: max }).int();
export const FloatRange = (min: number, max: number) => Field({ ge: min, le: max }).float();
export const PositiveInt = () => Field({ gte: 0 }).int();
export const PositiveFloat = () => Field({ gte: 0 }).float();
export const Numeric = (precision = 10, scale = 0) => Field({ precision, scale }).numeric();

// ================================
// 컬렉션 (5개)
// ================================
export const object = <T extends z.ZodRawShape>(shape: T) => z.object(shape);
export const array = <T extends z.ZodTypeAny>(itemSchema: T) => z.array(itemSchema);
export const record = <T extends z.ZodTypeAny>(valueSchema?: T) =>
  valueSchema ? z.record(z.string(), valueSchema) : z.record(z.string(), z.any());
export const enums = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);
export const any = () => z.any().refine((val) => val !== undefined && val !== null);

// ================================
// 특수 타입 (1개)
// ================================
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
export const password = () => Field({ min_length: 8, pattern: PASSWORD_PATTERN }).str();

// ================================
// 파일 (2개)
// ================================
export const files = () => z.array(z.instanceof(File)).min(1);
export const requireFiles = (fileKey: string) => {
  const base = fileKey.replace(/Files$/, "");
  const flagKey = `hasExisting${base[0].toUpperCase()}${base.slice(1)}s`;
  return (val: any, ctx: z.RefinementCtx) => {
    if (val[flagKey]) return;
    const result = files().safeParse(val[fileKey]);
    if (result.success) return;
    result.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: [fileKey, ...issue.path] }));
  };
};
