import z from "zod";

import { loginZodSchema } from "../auth/auth.validation";
import type { TAnalyticsPeriod } from "./dashboard-overview.types";

const analyticsPeriodSchema = z.enum(["7d", "30d", "90d", "12m"] satisfies [
  TAnalyticsPeriod,
  ...TAnalyticsPeriod[],
]);

export const analyticsOverviewQuerySchema = z.object({
  period: analyticsPeriodSchema.default("30d"),
});

export type TAnalyticsOverviewQuery = z.infer<typeof analyticsOverviewQuerySchema>;

const newPasswordField = loginZodSchema.shape.password;

export const updateMyProfileZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(120, { message: "Name is too long." }),
  email: z.string().trim().email({ message: "Invalid email address." }).max(100),
  /** Optional WhatsApp contact for quotation PDFs; "" clears it. */
  whatsappNumber: z
    .string()
    .trim()
    .max(30, { message: "WhatsApp number is too long." })
    .optional(),
  /** Optional job title for quotation PDFs; "" clears it. */
  consultantDesignation: z
    .string()
    .trim()
    .max(120, { message: "Designation is too long." })
    .optional(),
  /** Required when changing email; verified server-side. */
  currentPassword: z.string().optional(),
});

export const changeMyPasswordZodSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, { message: "Confirm password is required." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
