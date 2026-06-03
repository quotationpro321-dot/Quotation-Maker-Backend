import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { transferCatalogService } from "./transfer-catalog.service";

export const transferCatalogController = {
  listLocations: catchAsync(async (_req: Request, res: Response) => {
    const data = await transferCatalogService.listLocations();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Transfer locations retrieved successfully",
      data,
    });
  }),
};
