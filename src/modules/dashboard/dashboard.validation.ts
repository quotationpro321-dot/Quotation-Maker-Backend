import z from "zod";

import { loginZodSchema } from "../auth/auth.validation";

const newPasswordField = loginZodSchema.shape.password;

export const updateMyProfileZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(120, { message: "Name is too long." }),
  email: z.string().trim().email({ message: "Invalid email address." }).max(100),
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
