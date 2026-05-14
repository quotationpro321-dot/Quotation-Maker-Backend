export enum UserRole {
  ADMIN = "admin",
  EMPLOYEE = "employee",
}

export enum UserStatus {
  BLOCKED = "blocked",
  DELETED = "deleted",
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}

export interface IUser {
  userId?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  password: string;
  role: UserRole;
  status: UserStatus;
  profilePhotoUrl?: string;
  /** Cloudinary `public_id` for deleting the previous avatar on replace. */
  profilePhotoPublicId?: string;
  passwordChangedAt?: Date;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  passwordResetUsedAt?: Date | null;
}
