import { Router } from "express";

import { checkAuth } from "../../middleware/checkAuth.middleware";
import { profileAvatarUpload } from "../../middleware/profileAvatarUpload.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { UserRole } from "../user/user.types";
import { usersController } from "./users.controller";
import {
  bulkDeleteUsersBodySchema,
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from "./users.validation";

const router = Router();

router.get(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(listUsersQuerySchema, "query"),
  usersController.list,
);

router.get(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(userIdParamsSchema, "params"),
  usersController.getById,
);

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(createUserBodySchema),
  usersController.create,
);

router.post(
  "/bulk-delete",
  checkAuth(UserRole.ADMIN),
  validateRequest(bulkDeleteUsersBodySchema),
  usersController.bulkRemove,
);

router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateUserBodySchema),
  usersController.update,
);

router.post(
  "/:id/restore",
  checkAuth(UserRole.ADMIN),
  validateRequest(userIdParamsSchema, "params"),
  usersController.restore,
);

router.post(
  "/:id/avatar",
  checkAuth(UserRole.ADMIN),
  validateRequest(userIdParamsSchema, "params"),
  profileAvatarUpload,
  usersController.uploadAvatar,
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(userIdParamsSchema, "params"),
  usersController.remove,
);

export const UsersRoutes = router;
