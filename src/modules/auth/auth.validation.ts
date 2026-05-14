import z from "zod";

/** Login: matches existing dashboard login policy. */
const loginPasswordSchema = z
  .string({ error: "Password must be string" })
  .min(8, { message: "Password must be at least 8 characters long." })
  .regex(/^(?=.*[A-Z])/, {
    message: "Password must contain at least 1 uppercase letter.",
  })
  .regex(/^(?=.*[!@#$%^&*])/, {
    message: "Password must contain at least 1 special character.",
  })
  .regex(/^(?=.*\d)/, {
    message: "Password must contain at least 1 number.",
  });

/**
 * Reset-password flow: aligned with `reset-password-form.tsx` (min 6, client-side match only).
 * Login rules stay stricter above.
 */
const resetFlowNewPasswordSchema = z
  .string({ error: "Password must be string" })
  .trim()
  .min(6, { message: "Password must be at least 6 characters." })
  .max(128, { message: "Password cannot exceed 128 characters." });

export const loginZodSchema = z.object({
  email: z
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: loginPasswordSchema,
});

export const forgotPasswordZodSchema = z.object({
  email: z
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
});

/** Query param `code` on GET `/auth/validate-reset-code` (opaque reset token from email link). */
export const validateResetCodeQuerySchema = z.object({
  code: z.preprocess(
    (val: unknown) => {
      if (Array.isArray(val)) return typeof val[0] === "string" ? val[0] : "";
      if (typeof val === "string") return val;
      return "";
    },
    z
      .string()
      .trim()
      .min(32, { message: "Reset code is too short." })
      .max(512, { message: "Reset code is too long." }),
  ),
});

export const resetPasswordZodSchema = z
  .object({
    code: z.string().trim().min(1, { message: "Reset code is required." }),
    newPassword: resetFlowNewPasswordSchema,
    confirmPassword: z
      .string({ error: "Confirm password must be string" })
      .trim()
      .min(1, { message: "Confirm password is required." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
