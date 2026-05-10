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
  password: string;
  role: UserRole;
  status: UserStatus;
  profilePhotoUrl?: string;
  passwordChangedAt?: Date;
}
