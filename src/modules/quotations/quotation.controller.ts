import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { quotationsService } from "./quotation.service";
import type { TListQuotationsQuery, TSaveQuotationBody } from "./quotation.validation";

function getActor(req: Request) {
  return {
    userId: String(req.user?.userId ?? ""),
    role: String(req.user?.role ?? ""),
  };
}

export const quotationsController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.validatedQuery as TListQuotationsQuery;
    const data = await quotationsService.list(query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotations retrieved successfully",
      data,
    });
  }),

  listMine: catchAsync(async (req: Request, res: Response) => {
    const query = req.validatedQuery as TListQuotationsQuery;
    const { userId } = getActor(req);
    const data = await quotationsService.list(query, userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your quotations retrieved successfully",
      data,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const { userId, role } = getActor(req);
    const data = await quotationsService.getById(id, userId, role);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation retrieved successfully",
      data,
    });
  }),

  getFullById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const { userId, role } = getActor(req);
    const data = await quotationsService.getFullById(id, userId, role);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation detail retrieved successfully",
      data,
    });
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as TSaveQuotationBody;
    const { userId } = getActor(req);
    const data = await quotationsService.create(body, userId);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Quotation saved successfully",
      data,
    });
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const body = req.body as TSaveQuotationBody;
    const { userId, role } = getActor(req);
    const data = await quotationsService.update(id, body, userId, role);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation updated successfully",
      data,
    });
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const { userId, role } = getActor(req);
    await quotationsService.remove(id, userId, role);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation deleted successfully",
      data: null,
    });
  }),
};
