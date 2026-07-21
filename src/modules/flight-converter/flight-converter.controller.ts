import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { logFlightConverterUsage } from "./models/flight-converter-usage.model";
import { flightConverterService } from "./flight-converter.service";
import type { TParseItineraryBody } from "./flight-converter.validation";

export const flightConverterController = {
  parse: catchAsync(async (req: Request, res: Response) => {
    const { rawText, options } = req.body as TParseItineraryBody;
    const data = await flightConverterService.parseItinerary(rawText, options);

    const userId = req.user?.userId;
    if (userId && data.segments.length > 0) {
      void logFlightConverterUsage(userId, data.segments.length);
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message:
        data.segments.length > 0
          ? "Itinerary parsed successfully"
          : "No flight segments could be parsed",
      data,
    });
  }),
};
