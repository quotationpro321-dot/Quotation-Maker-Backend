import crypto from "crypto";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { emailService } from "../../services/email.service";
import { cacheService } from "../../services/cache.service";
import AppError from "../../utils/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { createNewAccessTokenWithRefreshToken, createUserAuthTokens } from "../../utils/userTokens";
import { assertUserCanRequestPasswordReset } from "./assertUserCanRequestPasswordReset";
import { User } from "../user/user.model";
import { IUser } from "../user/user.types";

export const authService = {
  getNewAccessToken: async (refreshToken: string) => {
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return {
      accessToken: newAccessToken,
    };
  },
  login: async (res: Response, payload: Partial<IUser>) => {
    const { email, password } = payload;

    const cacheKey = CACHE_KEYS.USER_BY_EMAIL(email as string);

    let cachedUser = await cacheService.get<IUser>(cacheKey);

    if (!cachedUser) {
      cachedUser = await User.findOne({ email });

      if (!cachedUser) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
      }

      await cacheService.set(cacheKey, cachedUser, 60);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email does not exist");
    }
    const isPasswordMatch = await user.comparePassword(password as string);
    if (!isPasswordMatch) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Password");
    }

    const { accessToken, refreshToken } = createUserAuthTokens(cachedUser);
    setAuthCookie(res, {
      accessToken,
      refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  },

  forgotPassword: async (payload: { email: string }) => {
    const email = payload.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    assertUserCanRequestPasswordReset(user);

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + envVars.RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: resetTokenHash,
          passwordResetExpiresAt: expiresAt,
          passwordResetUsedAt: null,
        },
      },
    );

    const resetLink = `${envVars.FRONTEND_URL}/auth/reset-password?code=${resetToken}`;

    const result = await emailService.sendPasswordResetEmail({
      to: email,
      recipientName: user.name,
      resetCode: resetToken,
      resetLink,
      expiryMinutes: envVars.RESET_PASSWORD_EXPIRES_MINUTES,
    });

    if (!result.success) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
            passwordResetUsedAt: null,
          },
        },
      );
      const detail =
        result.error && typeof result.error === "object" && "message" in result.error
          ? String((result.error as { message: unknown }).message)
          : "";
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE,
        detail ? `Failed to send email: ${detail}` : "Failed to send email",
      );
    }
  },

  /**
   * Read-only check for the reset link from email. Does not consume the token.
   * Frontend uses this to show either the password form or the "token expired" UI.
   */
  validateResetCode: async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false as const };
    }

    const tokenHash = crypto.createHash("sha256").update(trimmed).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash });

    if (!user) {
      return { valid: false as const };
    }
    if (user.passwordResetUsedAt) {
      return { valid: false as const };
    }
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now()) {
      return { valid: false as const };
    }

    return { valid: true as const };
  },

  resetPassword: async (payload: {
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const { code, newPassword } = payload;
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash });

    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid reset code.");
    }

    if (user.passwordResetUsedAt) {
      throw new AppError(StatusCodes.BAD_REQUEST, "This reset code has already been used.");
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now()) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Reset code has expired.");
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        passwordResetTokenHash: tokenHash,
        passwordResetUsedAt: null,
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        password: newPassword,
        passwordResetUsedAt: new Date(),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired reset code.");
    }

    await cacheService.del(CACHE_KEYS.USER_BY_EMAIL(updatedUser.email));
  },
};
