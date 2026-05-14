import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import {
  forgotPasswordZodSchema,
  loginZodSchema,
  resetPasswordZodSchema,
} from "./auth.validation";
import { forgotPasswordRateLimit } from "../../middleware/forgotPasswordRateLimit.middleware";

const router = Router();

router.post("/refresh-token", authController.getNewAccessTokenByRefreshToken);
router.post("/logout", authController.logout);
router.post("/login", validateRequest(loginZodSchema), authController.login);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordZodSchema),
  forgotPasswordRateLimit,
  authController.forgotPassword,
);
router.get("/validate-reset-code", authController.validateResetCode);
router.post("/reset-password", validateRequest(resetPasswordZodSchema), authController.resetPassword);

export const AuthRoutes = router;
