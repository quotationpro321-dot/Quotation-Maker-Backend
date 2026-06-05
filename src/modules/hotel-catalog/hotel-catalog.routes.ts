import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { hotelCatalogController } from "./hotel-catalog.controller";
import { listHotelsQuerySchema } from "./hotel-catalog.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;

router.get("/hotel-areas", checkAuth(...staff), hotelCatalogController.listAreas);

router.get(
  "/hotels",
  checkAuth(...staff),
  validateRequest(listHotelsQuerySchema, "query"),
  hotelCatalogController.listHotels,
);

export const HotelCatalogRoutes = router;
