import redis from "../config/redis.config";

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error("[CACHE:GET]", error);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      console.error("[CACHE:SET]", error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("[CACHE:DEL]", error);
    }
  },

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = [];
      for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(String(key));
      }
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redis.del(key)));
      }
    } catch (error) {
      console.error("[CACHE:DEL_BY_PATTERN]", error);
    }
  },
};
