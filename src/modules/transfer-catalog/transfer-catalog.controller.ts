import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { transferCatalogService } from "./transfer-catalog.service";
import type {
  TCreateTransferLocationBody,
  TListTransferLocationsQuery,
  TUpdateTransferLocationBody,
} from "./transfer-catalog.validation";

export const transferCatalogController = {
  listLocations: catchAsync(async (req: Request, res: Response) => {
    const query = (req.validatedQuery ?? {}) as TListTransferLocationsQuery;
    const data = await transferCatalogService.listLocations(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Transfer locations retrieved successfully",
      data,
    });
  }),

  createLocation: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as TCreateTransferLocationBody;
    const data = await transferCatalogService.createLocation(body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Transfer location created successfully",
      data,
    });
  }),

  updateLocation: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const body = req.body as TUpdateTransferLocationBody;
    const data = await transferCatalogService.updateLocation(id, body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Transfer location updated successfully",
      data,
    });
  }),

  deleteLocation: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await transferCatalogService.deleteLocation(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Transfer location removed successfully",
      data: null,
    });
  }),
};
