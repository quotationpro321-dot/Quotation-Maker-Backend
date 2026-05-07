import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../utils/AppError";
import { User } from "../modules/user/user.model";
import type { UserPayload } from "../types";
import { verifyToken } from "../utils/jwt";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const accessToken = req.headers.authorization;
      const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

      if (!accessToken) {
        throw new AppError(403, "No Token Recived");
      }

      const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;

      const isUserExist = await User.findOne({
        email: verifiedToken.email,
      });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(403, "You are not permitted to view this route!!!");
      }
      req.user = verifiedToken as UserPayload;
      req.id = isUserExist._id.toString();
      next();
    } catch (error) {
      next(error);
    }
  };
