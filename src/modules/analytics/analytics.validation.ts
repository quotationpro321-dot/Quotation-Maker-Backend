import { z } from "zod";

export const trackEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventType: z.enum(["PageView", "FormSubmit", "Booking", "Contact", "Custom"]),
  page: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  // metadata: z.record(z.any()).optional(),
});
