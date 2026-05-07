import { Router } from "express";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cacheKeys.constant";
import { cacheResponse } from "../../middleware/cache.middleware";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validationRequest.middleware";
import { Role } from "../user/user.types";
import { analyticsController } from "./analytics.controller";
import { trackEventSchema } from "./analytics.validation";

const router = Router();

router.post("/track", validateRequest(trackEventSchema), analyticsController.trackEvent);

router.get(
  "/",
  checkAuth(Role.ADMIN),
  cacheResponse({ keyPrefix: CACHE_KEYS.ANALYTICS_LIST_PREFIX, ttl: CACHE_TTL.SHORT }),
  analyticsController.getAllAnalytics,
);

router.get("/analyticsStats", checkAuth(Role.ADMIN), analyticsController.getDashboardStats);

router.delete("/deleteAnalytics/:id", checkAuth(Role.ADMIN), analyticsController.deleteAnalytics);

router.delete("/deleteOldAnalytics", checkAuth(Role.ADMIN), analyticsController.deleteOldAnalytics);

export const AnalyticsRoutes = router;
