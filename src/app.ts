import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import redisClient from "./config/redis.config";
import { httpMessages } from "./constants/httpMessages";
import { globalErrorHandler } from "./middleware/globalErrorHandler.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { v1Router } from "./routes";
import { sendResponse } from "./utils/sendResponse";

const app: Application = express();
const allowedOrigins = ["http://localhost:3000", "https://alsama-dashboard.vercel.app"];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like Next.js server-side rewrites)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
app.options(/.*/, cors(corsOptions));

app.use("/api/v1", v1Router);
// entry point
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: httpMessages.WELCOME_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/test-cache", async (req, res) => {
  await redisClient.set("test", "Hello Redis", { EX: 60 });

  const value = await redisClient.get("test");

  res.json({
    success: true,
    message: "Cache working",
    value,
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
