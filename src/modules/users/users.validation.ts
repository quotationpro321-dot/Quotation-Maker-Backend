import z from "zod";

import { loginZodSchema } from "../auth/auth.validation";
import { UserRole, UserStatus } from "../user/user.types";

const userRoleSchema = z.enum([UserRole.ADMIN, UserRole.EMPLOYEE]);
const userStatusSchema = z.enum([
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.BLOCKED,
  UserStatus.BANNED,
  UserStatus.DELETED,
]);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().max(120).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  sortBy: z.enum(["name", "email", "role", "status", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  fields: z.string().trim().max(200).optional(),
});

export const createUserBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(120, { message: "Name is too long." }),
  email: z.string().trim().email({ message: "Invalid email address." }).max(100),
  password: loginZodSchema.shape.password,
  role: userRoleSchema.default(UserRole.EMPLOYEE),
  status: userStatusSchema.default(UserStatus.ACTIVE),
  emailVerified: z.boolean().optional().default(true),
});

export const updateUserBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Name is required." })
      .max(120, { message: "Name is too long." })
      .optional(),
    email: z.string().trim().email({ message: "Invalid email address." }).max(100).optional(),
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional(),
    emailVerified: z.boolean().optional(),
    password: loginZodSchema.shape.password.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1, { message: "User id is required." }),
});

export const bulkDeleteUsersBodySchema = z.object({
  ids: z
    .array(z.string().trim().min(1))
    .min(1, { message: "Select at least one user to delete." })
    .max(100, { message: "You can delete at most 100 users at a time." }),
});
