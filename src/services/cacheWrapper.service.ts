import { cacheService } from "./cache.service";

interface CacheWrapOptions<T> {
  key: string;
  ttl?: number;
  fetcher: () => Promise<T>;
}

export const cacheWrapperService = {
  async getOrSet<T>({ key, ttl = 300, fetcher }: CacheWrapOptions<T>): Promise<T> {
    const cached = await cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetcher();
    await cacheService.set(key, freshData, ttl);
    return freshData;
  },

  async invalidate(keys: string[] = [], patterns: string[] = []): Promise<void> {
    await Promise.all([
      ...keys.map((key) => cacheService.del(key)),
      ...patterns.map((pattern) => cacheService.delByPattern(pattern)),
    ]);
  },
};
