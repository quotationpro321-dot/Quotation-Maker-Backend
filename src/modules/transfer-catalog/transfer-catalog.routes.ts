import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { transferCatalogController } from "./transfer-catalog.controller";
import {
  createTransferLocationBodySchema,
  listTransferLocationsQuerySchema,
  transferLocationIdParamsSchema,
  updateTransferLocationBodySchema,
} from "./transfer-catalog.validation";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;
const adminOnly = [UserRole.ADMIN] as const;

router.get(
  "/transfer-locations",
  checkAuth(...staff),
  validateRequest(listTransferLocationsQuerySchema, "query"),
  transferCatalogController.listLocations,
);

router.post(
  "/transfer-locations",
  checkAuth(...adminOnly),
  validateRequest(createTransferLocationBodySchema),
  transferCatalogController.createLocation,
);

router.patch(
  "/transfer-locations/:id",
  checkAuth(...adminOnly),
  validateRequest(transferLocationIdParamsSchema, "params"),
  validateRequest(updateTransferLocationBodySchema),
  transferCatalogController.updateLocation,
);

router.delete(
  "/transfer-locations/:id",
  checkAuth(...adminOnly),
  validateRequest(transferLocationIdParamsSchema, "params"),
  transferCatalogController.deleteLocation,
);

export const TransferCatalogRoutes = router;
