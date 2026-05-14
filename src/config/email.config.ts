import { Resend } from "resend";
import { COMPANY_INFO } from "../constants/company.constant";
import { envVars } from "./env";

if (!envVars.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

export const resend = new Resend(envVars.RESEND_API_KEY);

export const EMAIL_CONFIG = {
  from: `${COMPANY_INFO.name} <${envVars.RESEND_FROM_EMAIL}>`,
  adminEmail: COMPANY_INFO.email,
  replyTo: COMPANY_INFO.email,

  subjects: {
    passwordReset: `Reset your password - ${COMPANY_INFO.name}`,
  },
} as const;
