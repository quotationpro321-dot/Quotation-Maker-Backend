import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { quotationsController } from "./quotation.controller";
import {
  listQuotationsQuerySchema,
  quotationIdParamsSchema,
  saveQuotationBodySchema,
} from "./quotation.validation";

const router = Router();
const staffRoles = [UserRole.ADMIN, UserRole.EMPLOYEE];

router.get(
  "/mine",
  checkAuth(...staffRoles),
  validateRequest(listQuotationsQuerySchema, "query"),
  quotationsController.listMine,
);

router.get(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(listQuotationsQuerySchema, "query"),
  quotationsController.list,
);

router.get(
  "/:id/full",
  checkAuth(...staffRoles),
  validateRequest(quotationIdParamsSchema, "params"),
  quotationsController.getFullById,
);

router.get(
  "/:id",
  checkAuth(...staffRoles),
  validateRequest(quotationIdParamsSchema, "params"),
  quotationsController.getById,
);

router.post(
  "/",
  checkAuth(...staffRoles),
  validateRequest(saveQuotationBodySchema),
  quotationsController.create,
);

router.put(
  "/:id",
  checkAuth(...staffRoles),
  validateRequest(quotationIdParamsSchema, "params"),
  validateRequest(saveQuotationBodySchema),
  quotationsController.update,
);

router.delete(
  "/:id",
  checkAuth(...staffRoles),
  validateRequest(quotationIdParamsSchema, "params"),
  quotationsController.remove,
);

export const QuotationsRoutes = router;
