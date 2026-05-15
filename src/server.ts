import { Server } from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { envVars } from "./config/env";
import redisClient, { connectRedis } from "./config/redis.config";
import { startDeletedUserAnonymizeScheduler } from "./jobs/deletedUserAnonymize.scheduler";
import { seedAdmin } from "./utils/seedAdmin";

let server: Server;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    server = app.listen(envVars.PORT, () => {
      console.log(`App listening at port http://localhost:${envVars.PORT}`);
    });

    if (server) {
      server.timeout = 600000;
      server.keepAliveTimeout = 610000;
      server.headersTimeout = 620000;

      console.log(`✅ Server timeout configured: ${server.timeout / 1000}s`);
    }

    startDeletedUserAnonymizeScheduler();
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await startServer();
  await seedAdmin();
})();

process.on("unhandledRejection", (err) => {
  console.log(`Unhandled rejection detected... server shutting down...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log(`Uncaught exception detected... server shutting down...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGTERM", (err) => {
  console.log(`SIGTERM signal received... server shutting down...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGINT", (err) => {
  console.log(`SIGINT signal received... server shutting down...`, err);
  
  if (server) {
    server.close(async () => {
      await redisClient.quit();
      process.exit(1);
    });
  }
  process.exit(1);
});
