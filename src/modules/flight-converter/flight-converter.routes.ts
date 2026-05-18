import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { flightConverterRateLimit } from "../../middleware/flightConverterRateLimit.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { flightConverterController } from "./flight-converter.controller";
import { parseItineraryBodySchema } from "./flight-converter.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;

router.post(
  "/parse",
  checkAuth(...staff),
  flightConverterRateLimit,
  validateRequest(parseItineraryBodySchema),
  flightConverterController.parse,
);

export const FlightConverterRoutes = router;
