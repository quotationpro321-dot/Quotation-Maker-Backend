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
  /** Optional WhatsApp contact shown on the user's quotation PDFs. */
  whatsappNumber?: string | null;
  profilePhotoUrl?: string;
  /** Cloudinary `public_id` for deleting the previous avatar on replace. */
  profilePhotoPublicId?: string;
  passwordChangedAt?: Date;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  passwordResetUsedAt?: Date | null;
  /** Set when status becomes `deleted` (soft delete). */
  deletedAt?: Date | null;
  /** Set after retention period; PII is cleared but `_id` is kept for references. */
  anonymizedAt?: Date | null;
}
