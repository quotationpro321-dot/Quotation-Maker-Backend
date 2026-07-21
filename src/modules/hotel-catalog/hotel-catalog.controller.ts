import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { hotelCatalogService } from "./hotel-catalog.service";
import type {
  TCreateHotelAreaBody,
  TCreateHotelBody,
  TListHotelAreasQuery,
  TListHotelsQuery,
  TUpdateHotelAreaBody,
  TUpdateHotelBody,
} from "./hotel-catalog.validation";

export const hotelCatalogController = {
  listAreas: catchAsync(async (req: Request, res: Response) => {
    const query = (req.validatedQuery ?? {}) as TListHotelAreasQuery;
    const data = await hotelCatalogService.listAreas(query);

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

  createArea: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as TCreateHotelAreaBody;
    const data = await hotelCatalogService.createArea(body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Hotel area created successfully",
      data,
    });
  }),

  updateArea: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const body = req.body as TUpdateHotelAreaBody;
    const data = await hotelCatalogService.updateArea(id, body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotel area updated successfully",
      data,
    });
  }),

  deleteArea: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await hotelCatalogService.deleteArea(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotel area removed successfully",
      data: null,
    });
  }),

  createHotel: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as TCreateHotelBody;
    const data = await hotelCatalogService.createHotel(body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Hotel created successfully",
      data,
    });
  }),

  updateHotel: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const body = req.body as TUpdateHotelBody;
    const data = await hotelCatalogService.updateHotel(id, body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotel updated successfully",
      data,
    });
  }),

  deleteHotel: catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await hotelCatalogService.deleteHotel(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hotel removed successfully",
      data: null,
    });
  }),
};
