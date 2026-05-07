import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { analyticsService } from "./analytics.service";

const isDevelopmentRequest = (req: Request): boolean => {
  const host = req.headers.host || "";
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  const developmentIndicators = ["localhost", "127.0.0.1", "192.168.", "10.0.", ".local"];

  return developmentIndicators.some(
    (indicator) =>
      host.includes(indicator) || origin.includes(indicator) || referer.includes(indicator),
  );
};

export const analyticsController = {
  trackEvent: catchAsync(async (req: Request, res: Response) => {
    if (isDevelopmentRequest(req)) {
      return sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Development tracking ignored.",
        data: null,
      });
    }
    // Get IP address from request
    const ipAddress =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress;

    // Get the current host for referrer validation
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || "localhost";
    const currentHost = `${protocol}://${host}`;

    const payload = {
      ...req.body,
      userAgent: req.headers["user-agent"],
      ipAddress,
      // Pass current host to service for validation
      currentHost,
    };

    const event = await analyticsService.trackEvent(payload);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Event tracked successfully.",
      data: event,
    });
  }),

  getAllAnalytics: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const analytics = await analyticsService.getAllAnalytics(query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Analytics retrieved successfully.",
      data: analytics,
    });
  }),

  getDashboardStats: catchAsync(async (req: Request, res: Response) => {
    const stats = await analyticsService.getDashboardStats();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Dashboard stats retrieved successfully.",
      data: stats,
    });
  }),

  deleteAnalytics: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await analyticsService.deleteAnalytics(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Analytics deleted successfully.",
      data: null,
    });
  }),

  deleteOldAnalytics: catchAsync(async (req: Request, res: Response) => {
    const { days } = req.query;
    const result = await analyticsService.deleteOldAnalytics(days ? parseInt(days as string) : 30);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `Deleted ${result.deletedCount} old analytics records.`,
      data: result,
    });
  }),
};
