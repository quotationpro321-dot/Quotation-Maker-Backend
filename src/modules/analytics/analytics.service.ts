import { CACHE_KEYS, CACHE_TTL } from "../../constants/cacheKeys";
import { cacheWrapperService } from "../../services/cacheWrapper.service";
import QueryBuilder from "../../utils/queryBuilder";
import { normalizeReferrer } from "../../utils/normalizeReferrer";
import { Analytics } from "./analytics.model";
import { IAnalytics } from "./analytics.types";

export const analyticsService = {
  trackEvent: async (payload: IAnalytics) => {
    let normalizedReferrer = payload.referrer;

    if (payload.referrer) {
      const normalized = normalizeReferrer(payload.referrer);
      if (normalized === null) {
        normalizedReferrer = undefined;
      } else {
        normalizedReferrer = normalized;
      }
    }

    const event = await Analytics.create({
      ...payload,
      referrer: normalizedReferrer,
    });

    await cacheWrapperService.invalidate(
      [CACHE_KEYS.ANALYTICS_DASHBOARD, CACHE_KEYS.DASHBOARD_STATS],
      [`${CACHE_KEYS.ANALYTICS_LIST_PREFIX}:*`],
    );

    return event;
  },

  getAllAnalytics: async (query: Record<string, string>) => {
    const analyticsQuery = new QueryBuilder(Analytics.find(), query)
      .filter()
      .sort()
      .paginate()
      .fields();

    const [data, meta] = await Promise.all([
      analyticsQuery.modelQuery,
      analyticsQuery.countTotal(),
    ]);

    return { data, meta };
  },

  getDashboardStats: async () =>
    cacheWrapperService.getOrSet({
      key: CACHE_KEYS.ANALYTICS_DASHBOARD,
      ttl: CACHE_TTL.SHORT,
      fetcher: async () => {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
          totalPageViews,
          totalBookings,
          totalContacts,
          pageViewsLast24h,
          pageViewsLast7Days,
          pageViewsLast30Days,
          topPages,
          topReferrers,
          eventsByType,
        ] = await Promise.all([
          Analytics.countDocuments({ eventType: "PageView" }),
          Analytics.countDocuments({ eventType: "Booking" }),
          Analytics.countDocuments({ eventType: "Contact" }),
          Analytics.countDocuments({
            eventType: "PageView",
            createdAt: { $gte: last24Hours },
          }),
          Analytics.countDocuments({
            eventType: "PageView",
            createdAt: { $gte: last7Days },
          }),
          Analytics.countDocuments({
            eventType: "PageView",
            createdAt: { $gte: last30Days },
          }),
          Analytics.aggregate([
            { $match: { eventType: "PageView", page: { $exists: true } } },
            { $group: { _id: "$page", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
          Analytics.aggregate([
            {
              $match: {
                referrer: { $exists: true, $ne: "" },
              },
            },
            { $group: { _id: "$referrer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
          Analytics.aggregate([{ $group: { _id: "$eventType", count: { $sum: 1 } } }]),
        ]);

        return {
          overview: {
            totalPageViews,
            totalBookings,
            totalContacts,
            pageViewsLast24h,
            pageViewsLast7Days,
            pageViewsLast30Days,
          },
          topPages: topPages.map((p) => ({ page: p._id, views: p.count })),
          topReferrers: topReferrers.map((r) => ({
            referrer: r._id,
            visits: r.count,
          })),
          eventsByType: eventsByType.reduce(
            (acc, e) => {
              acc[e._id] = e.count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        };
      },
    }),

  deleteAnalytics: async (id: string) => {
    const result = await Analytics.findByIdAndDelete(id);
    await cacheWrapperService.invalidate(
      [CACHE_KEYS.ANALYTICS_DASHBOARD, CACHE_KEYS.DASHBOARD_STATS],
      [`${CACHE_KEYS.ANALYTICS_LIST_PREFIX}:*`],
    );
    return result;
  },

  deleteOldAnalytics: async (days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await Analytics.deleteMany({ createdAt: { $lt: cutoffDate } });
    await cacheWrapperService.invalidate(
      [CACHE_KEYS.ANALYTICS_DASHBOARD, CACHE_KEYS.DASHBOARD_STATS],
      [`${CACHE_KEYS.ANALYTICS_LIST_PREFIX}:*`],
    );
    return result;
  },
};
