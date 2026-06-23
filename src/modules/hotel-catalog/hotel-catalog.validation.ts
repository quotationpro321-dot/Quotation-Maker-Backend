import z from "zod";

import { CALCULATOR_CATALOG_TYPES } from "../catalog/catalog.types";

const calculatorTypeSchema = z.enum(CALCULATOR_CATALOG_TYPES);

export const listHotelAreasQuerySchema = z.object({
  calculatorType: calculatorTypeSchema.optional(),
  includeInactive: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true")
    .default(false),
});

export const listHotelsQuerySchema = z
  .object({
    area: z.string().trim().min(1).optional(),
    areaId: z.string().trim().min(1).optional(),
    calculatorType: calculatorTypeSchema.optional(),
    includeInactive: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === "true")
      .default(false),
  })
  .refine((data) => Boolean(data.area || data.areaId), {
    message: "Either area or areaId query parameter is required",
  });

export const hotelAreaIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const hotelIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createHotelAreaBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  calculatorType: calculatorTypeSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const updateHotelAreaBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(80).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const createHotelBodySchema = z.object({
  areaId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(200),
  city: z.string().trim().max(120).optional().default(""),
  country: z.string().trim().max(120).optional().default(""),
  distance: z.string().trim().max(120).optional().default(""),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateHotelBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    city: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional(),
    distance: z.string().trim().max(120).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type TListHotelAreasQuery = z.infer<typeof listHotelAreasQuerySchema>;
export type TListHotelsQuery = z.infer<typeof listHotelsQuerySchema>;
export type TCreateHotelAreaBody = z.infer<typeof createHotelAreaBodySchema>;
export type TUpdateHotelAreaBody = z.infer<typeof updateHotelAreaBodySchema>;
export type TCreateHotelBody = z.infer<typeof createHotelBodySchema>;
export type TUpdateHotelBody = z.infer<typeof updateHotelBodySchema>;
