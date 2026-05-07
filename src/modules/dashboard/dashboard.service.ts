import { CACHE_KEYS, CACHE_TTL } from "../../constants/cacheKeys.constant";
import { cacheService } from "../../services/cache.service";
import { Analytics } from "../analytics/analytics.model";
import { User } from "../user/user.model";

export const dashboardService = {
  getStats: async () => {
    const cached = await cacheService.get(CACHE_KEYS.DASHBOARD_STATS);

    if (cached) return cached;

    const [totalAnalyticsEvents, totalPixels] = await Promise.all([
      Analytics.countDocuments(),
      User.countDocuments(),
    ]);

    const result = { totalAnalyticsEvents, totalPixels };
    await cacheService.set(CACHE_KEYS.DASHBOARD_STATS, result, CACHE_TTL.MEDIUM);
    return result;
  },
};
