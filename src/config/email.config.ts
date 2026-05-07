import { Resend } from "resend";
import { COMPANY_INFO } from "../constants/company.constant";
import { envVars } from "./env";

// Validate environment variable
if (!envVars.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

// Initialize Resend SDK
export const resend = new Resend(envVars.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: `${COMPANY_INFO.name} <admin@nayeemsclick.co.uk>`,
  adminEmail: COMPANY_INFO.email,
  replyTo: COMPANY_INFO.email,

  // Email subjects
  subjects: {
    clientConfirmation: "Booking Submitted - Quotation-Maker Server",
    adminNotification: (clientName: string) => `New Booking Request from ${clientName}`,
  },
} as const;
