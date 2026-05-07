export const CACHE_KEYS = {
  DASHBOARD_STATS: "dashboard:stats",
  ANALYTICS_DASHBOARD: "analytics:dashboard",
  ANALYTICS_LIST_PREFIX: "analytics:list",
  USER: (id: string) => `user:${id}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  ANALYTICS: "analytics",
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 900,
} as const;
