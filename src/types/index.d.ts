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
    }
  }
}
