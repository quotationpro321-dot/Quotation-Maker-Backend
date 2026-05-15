import { StatusCodes } from "http-status-codes";

import AppError from "../../utils/AppError";
import { IUser, UserStatus } from "../user/user.types";

/** Only active accounts may sign in or use authenticated APIs. */
export function assertUserCanAuthenticate(user: IUser | null): asserts user is IUser {
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(StatusCodes.FORBIDDEN, "This account has been removed.");
  }

  if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
    throw new AppError(StatusCodes.FORBIDDEN, `This account is ${user.status}.`);
  }

  if (user.status === UserStatus.BANNED) {
    throw new AppError(StatusCodes.FORBIDDEN, "This account is banned.");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(StatusCodes.FORBIDDEN, "This account cannot sign in.");
  }
}
