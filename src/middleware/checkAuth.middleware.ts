import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import { assertUserCanAuthenticate } from "../modules/auth/assertUserCanAuthenticate";
import { User } from "../modules/user/user.model";
import type { UserPayload } from "../types";
import AppError from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const accessToken = req.headers.authorization;
      const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

      if (!accessToken) {
        throw new AppError(403, "No token received");
      }

      const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;

      const userRecord = await User.findOne({
        email: verifiedToken.email,
      });

      if (!userRecord) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
      }

      assertUserCanAuthenticate(userRecord);

      if (!authRoles.includes(String(verifiedToken.role))) {
        throw new AppError(403, "You are not permitted to access this resource");
      }

      const tokenUserId = (verifiedToken as JwtPayload & { userId?: unknown }).userId;
      req.user = {
        ...verifiedToken,
        email: String(verifiedToken.email),
        role: String(verifiedToken.role),
        userId: String(tokenUserId ?? userRecord._id),
      } as UserPayload;
      next();
    } catch (error) {
      next(error);
    }
  };
