import z from "zod";

export const listHotelsQuerySchema = z
  .object({
    area: z.string().trim().min(1).optional(),
    areaId: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.area || data.areaId), {
    message: "Either area or areaId query parameter is required",
  });

export type TListHotelsQuery = z.infer<typeof listHotelsQuerySchema>;
