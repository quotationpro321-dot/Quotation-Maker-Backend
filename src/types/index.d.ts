import { JwtPayload } from "jsonwebtoken";

export interface UserPayload extends JwtPayload {
  email: string;
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      /** Set by `validateRequest(schema, "query")` — do not assign to `req.query` (read-only). */
      validatedQuery?: unknown;
      /** Set by `validateRequest(schema, "params")` — do not assign to `req.params` (read-only). */
      validatedParams?: unknown;
    }
  }
}
