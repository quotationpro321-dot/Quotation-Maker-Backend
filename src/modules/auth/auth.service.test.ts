import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockedUserModel, mockedSendPasswordResetEmail } = vi.hoisted(() => ({
  mockedUserModel: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  mockedSendPasswordResetEmail: vi.fn(),
}));

vi.mock("../../config/env", () => ({
  envVars: {
    JWT_ACCESS_SECRET: "access-secret",
    JWT_ACCESS_EXPIRES_IN: "10m",
    JWT_REFRESH_SECRET: "refresh-secret",
    JWT_REFRESH_EXPIRES_IN: "7d",
    RESET_PASSWORD_EXPIRES_MINUTES: 15,
    FRONTEND_URL: "http://localhost:3000",
  },
}));

vi.mock("../user/user.model", () => ({
  User: mockedUserModel,
}));

vi.mock("../../services/email.service", () => ({
  emailService: {
    sendPasswordResetEmail: mockedSendPasswordResetEmail,
  },
}));

vi.mock("../../services/cache.service", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("../../utils/setCookie", () => ({
  setAuthCookie: vi.fn(),
}));

vi.mock("../../utils/userTokens", () => ({
  createNewAccessTokenWithRefreshToken: vi.fn(),
  createUserAuthTokens: vi.fn(),
}));

import { authService } from "./auth.service";
import { resetPasswordZodSchema } from "./auth.validation";
import { cacheService } from "../../services/cache.service";
import { UserStatus } from "../user/user.types";

describe("authService forgot/reset password", () => {
  const eligibleUser = {
    _id: "user-1",
    name: "Test User",
    email: "user@example.com",
    status: UserStatus.ACTIVE,
    emailVerified: true as boolean | undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forgot-password sends email for eligible user", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser });
    mockedUserModel.updateOne.mockResolvedValue({ acknowledged: true });
    mockedSendPasswordResetEmail.mockResolvedValueOnce({ success: true, data: { id: "email-1" } });

    await expect(authService.forgotPassword({ email: "user@example.com" })).resolves.toBeUndefined();
    expect(mockedUserModel.updateOne).toHaveBeenCalled();
    expect(mockedSendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it("forgot-password throws when user does not exist", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce(null);

    await expect(authService.forgotPassword({ email: "missing@example.com" })).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "User does not exist",
    });
    expect(mockedSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("forgot-password throws when user is not verified", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser, emailVerified: false });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      message: "User is not verified",
    });
  });

  it("forgot-password throws when user is inactive", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser, status: UserStatus.INACTIVE });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      message: "User is inactive",
    });
  });

  it("forgot-password throws when user is blocked", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser, status: UserStatus.BLOCKED });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      message: "User is blocked",
    });
  });

  it("forgot-password throws when user is banned", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser, status: UserStatus.BANNED });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      message: "User is banned",
    });
  });

  it("forgot-password throws when user is deleted", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser, status: UserStatus.DELETED });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      message: "User is deleted",
    });
  });

  it("forgot-password rolls back token when email send fails", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({ ...eligibleUser });
    mockedUserModel.updateOne.mockResolvedValue({ acknowledged: true });
    mockedSendPasswordResetEmail.mockResolvedValueOnce({
      success: false,
      error: { message: "Resend error" },
    });

    await expect(authService.forgotPassword({ email: "user@example.com" })).rejects.toMatchObject({
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      message: "Failed to send email: Resend error",
    });
    expect(mockedUserModel.updateOne).toHaveBeenCalledTimes(2);
  });

  it("reset-password succeeds for valid token and matching passwords", async () => {
    const rawCode = "valid-code";
    const hashedCode = crypto.createHash("sha256").update(rawCode).digest("hex");
    mockedUserModel.findOne.mockResolvedValueOnce({
      _id: "user-1",
      passwordResetTokenHash: hashedCode,
      passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      passwordResetUsedAt: null,
    });
    mockedUserModel.findOneAndUpdate.mockResolvedValueOnce({ _id: "user-1", email: "user@example.com" });

    await expect(
      authService.resetPassword({
        code: rawCode,
        newPassword: "Strong@123",
        confirmPassword: "Strong@123",
      }),
    ).resolves.toBeUndefined();
    expect(mockedUserModel.findOneAndUpdate).toHaveBeenCalledOnce();
    expect(cacheService.del).toHaveBeenCalledWith("user:email:user@example.com");
  });

  it("reset-password accepts 6-character password (aligned with frontend form)", async () => {
    const rawCode = "valid-code-2";
    const hashedCode = crypto.createHash("sha256").update(rawCode).digest("hex");
    mockedUserModel.findOne.mockResolvedValueOnce({
      _id: "user-2",
      passwordResetTokenHash: hashedCode,
      passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      passwordResetUsedAt: null,
    });
    mockedUserModel.findOneAndUpdate.mockResolvedValueOnce({ _id: "user-2", email: "six@example.com" });

    await expect(
      resetPasswordZodSchema.parseAsync({
        code: rawCode,
        newPassword: "Abcdef",
        confirmPassword: "Abcdef",
      }),
    ).resolves.toMatchObject({ newPassword: "Abcdef", confirmPassword: "Abcdef" });

    await expect(
      authService.resetPassword({
        code: rawCode,
        newPassword: "Abcdef",
        confirmPassword: "Abcdef",
      }),
    ).resolves.toBeUndefined();
  });

  it("reset-password validation rejects password shorter than 6 characters", async () => {
    await expect(
      resetPasswordZodSchema.parseAsync({
        code: "abc",
        newPassword: "Abcd1",
        confirmPassword: "Abcd1",
      }),
    ).rejects.toBeTruthy();
  });

  it("reset-password fails for invalid token", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce(null);

    await expect(
      authService.resetPassword({
        code: "invalid-code",
        newPassword: "Strong@123",
        confirmPassword: "Strong@123",
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Invalid reset code.",
    });
  });

  it("reset-password fails for expired token", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({
      _id: "user-1",
      passwordResetExpiresAt: new Date(Date.now() - 1000),
      passwordResetUsedAt: null,
    });

    await expect(
      authService.resetPassword({
        code: "expired-code",
        newPassword: "Strong@123",
        confirmPassword: "Strong@123",
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Reset code has expired.",
    });
  });

  it("reset-password fails for reused token", async () => {
    mockedUserModel.findOne.mockResolvedValueOnce({
      _id: "user-1",
      passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      passwordResetUsedAt: new Date(),
    });

    await expect(
      authService.resetPassword({
        code: "used-code",
        newPassword: "Strong@123",
        confirmPassword: "Strong@123",
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "This reset code has already been used.",
    });
  });

  it("validation fails for mismatched passwords", async () => {
    await expect(
      resetPasswordZodSchema.parseAsync({
        code: "abc123",
        newPassword: "Strong@123",
        confirmPassword: "Wrong@123",
      }),
    ).rejects.toBeTruthy();
  });
});
