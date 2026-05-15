import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { usersService, type TListUsersQuery } from "./users.service";

export const usersController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.validatedQuery as TListUsersQuery;
    const actorUserId = String(req.user?.userId ?? "");
    const data = await usersService.list(
      query,
      Types.ObjectId.isValid(actorUserId) ? actorUserId : undefined,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Users retrieved successfully",
      data,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const data = await usersService.getById(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User retrieved successfully",
      data,
    });
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const data = await usersService.create(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User created successfully",
      data,
    });
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const actorUserId = String(req.user?.userId ?? "");
    const data = await usersService.update(id, req.body, actorUserId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User updated successfully",
      data,
    });
  }),

  bulkRemove: catchAsync(async (req: Request, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    const actorUserId = String(req.user?.userId ?? "");
    const data = await usersService.bulkRemove(ids, actorUserId);

    const deletedCount = data.deleted.length;
    const failedCount = data.failed.length;
    let message = `${deletedCount} user${deletedCount === 1 ? "" : "s"} deleted successfully.`;
    if (failedCount > 0) {
      message += ` ${failedCount} could not be deleted.`;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message,
      data,
    });
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    const actorUserId = String(req.user?.userId ?? "");
    const data = await usersService.remove(id, actorUserId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User deleted successfully",
      data,
    });
  }),

  uploadAvatar: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.validatedParams as { id: string };
    if (!req.file) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Avatar image is required.");
    }
    const data = await usersService.uploadAvatar(id, req.file);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile photo updated successfully",
      data,
    });
  }),
};
