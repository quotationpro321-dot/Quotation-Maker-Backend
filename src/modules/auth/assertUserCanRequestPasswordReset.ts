import { StatusCodes } from "http-status-codes";
import AppError from "../../utils/AppError";
import { IUser, UserStatus } from "../user/user.types";

/**
 * Forgot-password eligibility: explicit errors (no generic success for unknown emails).
 */
export function assertUserCanRequestPasswordReset(user: IUser | null): asserts user is IUser {
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  if (user.emailVerified === false) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not verified");
  }

  if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
    throw new AppError(StatusCodes.BAD_REQUEST, `User is ${user.status}`);
  }

  if (user.status === UserStatus.BANNED) {
    throw new AppError(StatusCodes.BAD_REQUEST, `User is ${user.status}`);
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }
}
