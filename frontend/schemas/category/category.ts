// schemas/category/category.ts
import { z } from "zod";
import { CommonEntity } from "@/schemas/common/types";
import { StrRange, Field, Optional, PositiveInt, enums, object } from "@/lib/zod/helpers";

// ── Category (master) ──────────────────────────────────────────────────
export const CategorySchema = object({
  category_id: StrRange(1, 20),
  category_nm: StrRange(1, 200),
  sort_ordr: PositiveInt(),
  use_at: enums(["Y", "N"]),
  description: Optional(Field({ max_length: 1000 }).str()),
});

export const CategoryCreateInSchema = CategorySchema;
export const CategoryUpdateInSchema = CategorySchema.omit({ category_id: true });

export type Category = z.infer<typeof CategorySchema>;
export type CategoryOut = Category & CommonEntity;
export interface CategoriesOut {
  items: CategoryOut[];
  total_count: number;
}

// ── Product (detail) ───────────────────────────────────────────────────
export const ProductSchema = object({
  category_id: StrRange(1, 20),
  product_id: StrRange(1, 20),
  product_nm: StrRange(1, 200),
  price: PositiveInt(),
  use_at: enums(["Y", "N"]),
  description: Optional(Field({ max_length: 1000 }).str()),
});

export const ProductCreateInSchema = ProductSchema.omit({ category_id: true });
export const ProductUpdateInSchema = ProductSchema.omit({ category_id: true, product_id: true });

export type Product = z.infer<typeof ProductSchema>;
export type ProductOut = Product & CommonEntity & { category_nm?: string };
export interface ProductsOut {
  items: ProductOut[];
  total_count: number;
}
