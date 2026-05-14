/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EMAIL_CONFIG, resend } from "../config/email.config";
import {
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText,
  type PasswordResetEmailParams,
} from "../templates/password-reset.email.template";

interface EmailResult {
  success: boolean;
  data?: any;
  error?: any;
}

export type SendPasswordResetEmailInput = PasswordResetEmailParams & {
  to: string;
};

export const emailService = {
  /**
   * Send password reset email with code + browser link.
   * @returns `{ success, data?, error? }` — callers decide whether to fail or retry.
   */
  sendPasswordResetEmail: async (input: SendPasswordResetEmailInput): Promise<EmailResult> => {
    const { to, ...templateParams } = input;

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [to],
        replyTo: EMAIL_CONFIG.replyTo,
        subject: EMAIL_CONFIG.subjects.passwordReset,
        html: generatePasswordResetEmailHtml(templateParams),
        text: generatePasswordResetEmailText(templateParams),
      });

      if (error) {
        console.error("❌ Error sending password reset email:", error);
        return { success: false, error };
      }

      console.log("✅ Password reset email sent successfully:", {
        id: data?.id,
        to,
      });

      return { success: true, data };
    } catch (error) {
      console.error("❌ Error in sendPasswordResetEmail:", error);
      return { success: false, error };
    }
  },
};
