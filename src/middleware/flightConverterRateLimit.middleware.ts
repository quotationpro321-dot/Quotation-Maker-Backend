import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { envVars } from "../config/env";
import redisClient from "../config/redis.config";
import AppError from "../utils/AppError";

const getKey = (prefix: string, value: string) => `rate-limit:flight-converter:${prefix}:${value}`;

const incrementWithExpiry = async (key: string, windowSeconds: number) => {
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, windowSeconds);
  }
  return count;
};

export const flightConverterRateLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const windowSeconds = envVars.FLIGHT_CONVERTER_RATE_LIMIT_WINDOW_SECONDS;
    const maxRequests = envVars.FLIGHT_CONVERTER_RATE_LIMIT_MAX_REQUESTS;
    const userId = String(req.user?.userId ?? "anonymous");
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const [ipCount, userCount] = await Promise.all([
      incrementWithExpiry(getKey("ip", ip), windowSeconds),
      incrementWithExpiry(getKey("user", userId), windowSeconds),
    ]);

    if (ipCount > maxRequests || userCount > maxRequests) {
      throw new AppError(StatusCodes.TOO_MANY_REQUESTS, "Too many parse requests. Please try again later.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
