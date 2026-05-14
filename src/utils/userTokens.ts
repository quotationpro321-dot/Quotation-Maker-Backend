import { StatusCodes } from "http-status-codes";
import { envVars } from "../config/env";
import AppError from "./AppError";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { IUser } from "../modules/user/user.types";

export const createUserAuthTokens = (user: Partial<IUser> & { _id?: Types.ObjectId }) => {
  const jwtPayload = {
    email: user?.email,
    userId: user._id != null ? String(user._id) : undefined,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES_IN,
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES_IN,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload;
  const userRecord = await User.findOne({
    email: verifiedRefreshToken.email,
  });

  if (!userRecord) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  const tokenIssuedAtMs = Number(verifiedRefreshToken.iat ?? 0) * 1000;
  if (userRecord.passwordChangedAt && tokenIssuedAtMs < userRecord.passwordChangedAt.getTime()) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Session expired. Please log in again.");
  }

  const jwtPayload = {
    userId: String(userRecord._id),
    email: userRecord.email,
    role: userRecord.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES_IN,
  );

  return accessToken;
};
