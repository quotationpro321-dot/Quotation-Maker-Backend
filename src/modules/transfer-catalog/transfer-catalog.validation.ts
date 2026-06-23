import z from "zod";

import { CALCULATOR_CATALOG_TYPES } from "../catalog/catalog.types";

const calculatorTypeSchema = z.enum(CALCULATOR_CATALOG_TYPES);

export const listTransferLocationsQuerySchema = z.object({
  calculatorType: calculatorTypeSchema.optional(),
  includeInactive: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true")
    .default(false),
});

export const transferLocationIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createTransferLocationBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  calculatorType: calculatorTypeSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const updateTransferLocationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(80).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type TListTransferLocationsQuery = z.infer<
  typeof listTransferLocationsQuerySchema
>;
export type TCreateTransferLocationBody = z.infer<
  typeof createTransferLocationBodySchema
>;
export type TUpdateTransferLocationBody = z.infer<
  typeof updateTransferLocationBodySchema
>;
