/* eslint-disable no-console */
import { NextFunction, Request, Response } from "express";

export const uploadTimeout = (timeoutMs = 600000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.socket) {
      const previousTimeout = req.socket.timeout;
      req.socket.setTimeout(timeoutMs);

      console.log(
        `⏱️  Extended timeout for ${req.method} ${req.path}: ${previousTimeout}ms → ${timeoutMs}ms`,
      );

      req.socket.once("timeout", () => {
        console.error(`❌ Socket timeout after ${timeoutMs / 1000}s for ${req.method} ${req.path}`);
        // Don't destroy socket here - let the default handler manage it
      });
    }

    next();
  };
};

/**
 * Pre-configured middleware for video uploads (10 minutes)
 */
export const videoUploadTimeout = uploadTimeout(600000);

/**
 * Pre-configured middleware for extra large uploads (20 minutes)
 */
export const extraLargeUploadTimeout = uploadTimeout(1200000);
