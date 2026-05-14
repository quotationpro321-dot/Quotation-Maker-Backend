/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { setAuthCookie } from "../../utils/setCookie";
import AppError from "../../utils/AppError";
import { validateResetCodeQuerySchema } from "./auth.validation";

export const authController = {
  getNewAccessTokenByRefreshToken: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token received from cookies");
      }
      const tokenInfo = await authService.getNewAccessToken(refreshToken as string);

      setAuthCookie(res, tokenInfo);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "New access token retrieved successfully",
        data: tokenInfo,
      });
    },
  ),

  logout: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Logout successfully",
      data: null,
    });
  }),

  login: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.login(res, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User Logged In Successfully",
      data: result,
    });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Password reset link has been sent to your email.",
      data: null,
    });
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Password reset successfully.",
      data: null,
    });
  }),

  validateResetCode: catchAsync(async (req: Request, res: Response) => {
    const parsed = validateResetCodeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Invalid reset code.",
        data: { valid: false },
      });
      return;
    }

    const result = await authService.validateResetCode(parsed.data.code);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.valid ? "Reset code is valid." : "Reset code is invalid or expired.",
      data: result,
    });
  }),
};
