import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { profileAvatarUpload } from "../../middleware/profileAvatarUpload.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { dashboardController } from "./dashboard.controller";
import {
  analyticsOverviewQuerySchema,
  changeMyPasswordZodSchema,
  updateMyProfileZodSchema,
} from "./dashboard.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;

router.get("/stats", checkAuth(UserRole.ADMIN), dashboardController.getStats);

router.get("/overview", checkAuth(...staff), dashboardController.getOverview);

router.get(
  "/analytics",
  checkAuth(UserRole.ADMIN),
  validateRequest(analyticsOverviewQuerySchema, "query"),
  dashboardController.getAnalytics,
);

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
