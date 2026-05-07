import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

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
};
