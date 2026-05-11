import { createClient } from "redis";
import { envVars } from "./env";

const redisClient = createClient({ url: envVars.REDIS_URL });

redisClient.on("ready", () => {
  console.log("✓ Redis ready");
});

redisClient.on("error", (err) => console.error("Redis error:", err.message));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✓ Redis connected");
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

export default redisClient;
