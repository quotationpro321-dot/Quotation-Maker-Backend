import z from "zod";

export const parseItineraryBodySchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(10, { message: "Itinerary text is too short." })
    .max(50_000, { message: "Itinerary text exceeds the maximum length." }),
  options: z
    .object({
      timeFormat: z.enum(["12h", "24h"]).optional(),
      showOperatedBy: z.boolean().optional(),
    })
    .optional(),
});

export type TParseItineraryBody = z.infer<typeof parseItineraryBodySchema>;
