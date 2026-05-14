import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../config/env";
import redisClient from "../config/redis.config";
import AppError from "../utils/AppError";

const getKey = (prefix: string, value: string) => `rate-limit:forgot-password:${prefix}:${value}`;

const incrementWithExpiry = async (key: string, windowSeconds: number) => {
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, windowSeconds);
  }
  return count;
};

export const forgotPasswordRateLimit = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const windowSeconds = envVars.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS;
    const maxRequests = envVars.FORGOT_PASSWORD_RATE_LIMIT_MAX_REQUESTS;
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const [ipCount, emailCount] = await Promise.all([
      incrementWithExpiry(getKey("ip", ip), windowSeconds),
      email ? incrementWithExpiry(getKey("email", email), windowSeconds) : Promise.resolve(0),
    ]);

    if (ipCount > maxRequests || emailCount > maxRequests) {
      throw new AppError(StatusCodes.TOO_MANY_REQUESTS, "Too many requests, please try again later");
    }

    next();
  } catch (error) {
    next(error);
  }
};
