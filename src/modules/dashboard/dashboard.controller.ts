import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  getStats: catchAsync(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  }),

  getMyProfile: catchAsync(async (req: Request, res: Response) => {
    const data = await dashboardService.getMyProfile(req);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile retrieved successfully",
      data,
    });
  }),

  updateMyProfile: catchAsync(async (req: Request, res: Response) => {
    const { profile, message } = await dashboardService.updateMyProfile(req, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message,
      data: profile,
    });
  }),

  changeMyPassword: catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    await dashboardService.changeMyPassword(req, { currentPassword, newPassword });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Password updated successfully",
      data: null,
    });
  }),

  uploadMyProfileAvatar: catchAsync(async (req: Request, res: Response) => {
    const data = await dashboardService.uploadMyProfileAvatar(req);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile photo updated successfully",
      data,
    });
  }),
};
