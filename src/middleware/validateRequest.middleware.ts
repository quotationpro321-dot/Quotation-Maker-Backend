import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type TValidateTarget = "body" | "query" | "params";

/**
 * Validates `req.body`, `req.query`, or `req.params` with Zod.
 * Query/params are stored on `req.validatedQuery` / `req.validatedParams` because
 * Express defines those properties as read-only getters.
 */
export const validateRequest =
  (zodSchema: ZodType, target: TValidateTarget = "body") =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await zodSchema.parseAsync(req[target]);

      if (target === "body") {
        req.body = parsed;
      } else if (target === "query") {
        req.validatedQuery = parsed;
      } else {
        req.validatedParams = parsed;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
