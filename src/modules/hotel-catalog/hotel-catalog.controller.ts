import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { hotelCatalogService } from "./hotel-catalog.service";
import type { TListHotelsQuery } from "./hotel-catalog.validation";

export const hotelCatalogController = {
  listAreas: catchAsync(async (_req: Request, res: Response) => {
    const data = await hotelCatalogService.listAreas();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotel areas retrieved successfully",
      data,
    });
  }),

  listHotels: catchAsync(async (req: Request, res: Response) => {
    const query = req.validatedQuery as TListHotelsQuery;
    const data = await hotelCatalogService.listHotelsByArea(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotels retrieved successfully",
      data,
    });
  }),
};
