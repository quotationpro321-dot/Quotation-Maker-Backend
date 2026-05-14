import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  NODE_ENV: "development" | "production";
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: string;
  ADMIN_NAME: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  PDF_SHIFT_API_KEY: string;
  RESEND_API_KEY: string;
  FRONTEND_URL: string;
  RESET_PASSWORD_EXPIRES_MINUTES: number;
  FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS: number;
  FORGOT_PASSWORD_RATE_LIMIT_MAX_REQUESTS: number;
  /**
   * Mailbox part of the Resend `from` header (no display name).
   * Default `onboarding@resend.dev` is Resend's sandbox sender; replace with `noreply@yourdomain.com`
   * once you verify your domain at https://resend.com/domains.
   */
  RESEND_FROM_EMAIL: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DATABASE_URL",
    "REDIS_URL",
    "NODE_ENV",

    "JWT_ACCESS_EXPIRES_IN",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES_IN",
    "BCRYPT_SALT_ROUNDS",
    "ADMIN_NAME",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",

    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",

    "PDF_SHIFT_API_KEY",
    "FRONTEND_URL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_URL: process.env.REDIS_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as string,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_NAME: process.env.ADMIN_NAME as string,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    PDF_SHIFT_API_KEY: process.env.PDF_SHIFT_API_KEY as string,
    RESEND_API_KEY: process.env.RESEND_API_KEY as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    RESET_PASSWORD_EXPIRES_MINUTES: Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES ?? 15),
    FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS: Number(
      process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS ?? 300,
    ),
    FORGOT_PASSWORD_RATE_LIMIT_MAX_REQUESTS: Number(
      process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX_REQUESTS ?? 5,
    ),
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev",
  };
};

export const envVars = loadEnvVariables();
