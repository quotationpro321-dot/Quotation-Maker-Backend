import { NextFunction, Request, Response } from "express";
import { cacheService } from "../services/cache.service";

interface CacheMiddlewareOptions {
  ttl?: number;
  keyPrefix: string;
}

const normalizeQuery = (query: Request["query"]): string => {
  const entries = Object.entries(query).sort(([a], [b]) => a.localeCompare(b));
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    normalized[key] = value;
  }
  return JSON.stringify(normalized);
};

const buildCacheKey = (req: Request, keyPrefix: string): string => {
  const userId = req.user?.userId;
  const scope = userId ? `user:${userId}` : "public";
  const query = normalizeQuery(req.query);
  return `${keyPrefix}:${scope}:${req.path}:${query}`;
};

export const cacheResponse = (options: CacheMiddlewareOptions) => {
  const { ttl = 60, keyPrefix } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== "GET" || req.headers["x-cache-bypass"] === "1") {
        return next();
      }

      const cacheKey = buildCacheKey(req, keyPrefix);
      const cached = await cacheService.get<unknown>(cacheKey);

      if (cached !== null) {
        res.setHeader("x-cache", "HIT");
        return res.status(200).json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        if (res.statusCode === 200) {
          void cacheService.set(cacheKey, body, ttl);
          res.setHeader("x-cache", "MISS");
        }
        return originalJson(body);
      };

      return next();
    } catch (error) {
      console.error("[CACHE:MIDDLEWARE]", error);
      return next();
    }
  };
};
