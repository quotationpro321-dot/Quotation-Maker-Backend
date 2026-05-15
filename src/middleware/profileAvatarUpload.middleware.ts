import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { multerProfileAvatar } from "../config/multer.config";
import AppError from "../utils/AppError";

export const profileAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
  multerProfileAvatar.single("avatar")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(413, "Image must be 1MB or smaller."));
      }
      return next(new AppError(400, err.message));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};
