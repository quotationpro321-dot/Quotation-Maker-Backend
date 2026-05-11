import { Router } from "express";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cacheKeys";
import { cacheResponse } from "../../middleware/cache.middleware";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { analyticsController } from "./analytics.controller";
import { trackEventSchema } from "./analytics.validation";

const router = Router();

router.post("/track", validateRequest(trackEventSchema), analyticsController.trackEvent);

router.get(
  "/",
  checkAuth(UserRole.ADMIN),
  cacheResponse({ keyPrefix: CACHE_KEYS.ANALYTICS_LIST_PREFIX, ttl: CACHE_TTL.SHORT }),
  analyticsController.getAllAnalytics,
);

router.get("/analyticsStats", checkAuth(UserRole.ADMIN), analyticsController.getDashboardStats);

router.delete(
  "/deleteAnalytics/:id",
  checkAuth(UserRole.ADMIN),
  analyticsController.deleteAnalytics,
);

router.delete(
  "/deleteOldAnalytics",
  checkAuth(UserRole.ADMIN),
  analyticsController.deleteOldAnalytics,
);

export const AnalyticsRoutes = router;
