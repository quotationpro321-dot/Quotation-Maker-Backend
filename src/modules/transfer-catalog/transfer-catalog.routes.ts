import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { UserRole } from "../user/user.types";
import { transferCatalogController } from "./transfer-catalog.controller";

const router = Router();

const staff = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;

router.get(
  "/transfer-locations",
  checkAuth(...staff),
  transferCatalogController.listLocations,
);

export const TransferCatalogRoutes = router;
