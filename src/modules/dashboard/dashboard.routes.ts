import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";

import { multerProfileAvatar } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import AppError from "../../utils/AppError";
import { UserRole } from "../user/user.types";
import { dashboardController } from "./dashboard.controller";
import {
  changeMyPasswordZodSchema,
  updateMyProfileZodSchema,
} from "./dashboard.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;

const profileAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
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

router.get("/stats", checkAuth(UserRole.ADMIN), dashboardController.getStats);

router.get("/profile", checkAuth(...staff), dashboardController.getMyProfile);
router.post(
  "/profile/avatar",
  checkAuth(...staff),
  profileAvatarUpload,
  dashboardController.uploadMyProfileAvatar,
);
router.patch(
  "/profile",
  checkAuth(...staff),
  validateRequest(updateMyProfileZodSchema),
  dashboardController.updateMyProfile,
);
router.patch(
  "/profile/password",
  checkAuth(...staff),
  validateRequest(changeMyPasswordZodSchema),
  dashboardController.changeMyPassword,
);

export const DashboardRoutes = router;
