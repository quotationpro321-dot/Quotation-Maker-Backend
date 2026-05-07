import { createClient } from "redis";
import { envVars } from "./env";

const redisClient = createClient({ url: envVars.REDIS_URL });

redisClient.on("connect", () => console.log("✓ Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;
