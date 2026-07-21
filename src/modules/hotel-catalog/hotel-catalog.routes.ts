import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { hotelCatalogController } from "./hotel-catalog.controller";
import {
  createHotelAreaBodySchema,
  createHotelBodySchema,
  hotelAreaIdParamsSchema,
  hotelIdParamsSchema,
  listHotelAreasQuerySchema,
  listHotelsQuerySchema,
  updateHotelAreaBodySchema,
  updateHotelBodySchema,
} from "./hotel-catalog.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;
const adminOnly = [UserRole.ADMIN] as const;

router.get(
  "/hotel-areas",
  checkAuth(...staff),
  validateRequest(listHotelAreasQuerySchema, "query"),
  hotelCatalogController.listAreas,
);

router.post(
  "/hotel-areas",
  checkAuth(...adminOnly),
  validateRequest(createHotelAreaBodySchema),
  hotelCatalogController.createArea,
);

router.patch(
  "/hotel-areas/:id",
  checkAuth(...adminOnly),
  validateRequest(hotelAreaIdParamsSchema, "params"),
  validateRequest(updateHotelAreaBodySchema),
  hotelCatalogController.updateArea,
);

router.delete(
  "/hotel-areas/:id",
  checkAuth(...adminOnly),
  validateRequest(hotelAreaIdParamsSchema, "params"),
  hotelCatalogController.deleteArea,
);

router.get(
  "/hotels",
  checkAuth(...staff),
  validateRequest(listHotelsQuerySchema, "query"),
  hotelCatalogController.listHotels,
);

router.post(
  "/hotels",
  checkAuth(...adminOnly),
  validateRequest(createHotelBodySchema),
  hotelCatalogController.createHotel,
);

router.patch(
  "/hotels/:id",
  checkAuth(...adminOnly),
  validateRequest(hotelIdParamsSchema, "params"),
  validateRequest(updateHotelBodySchema),
  hotelCatalogController.updateHotel,
);

router.delete(
  "/hotels/:id",
  checkAuth(...adminOnly),
  validateRequest(hotelIdParamsSchema, "params"),
  hotelCatalogController.deleteHotel,
);

export const HotelCatalogRoutes = router;
