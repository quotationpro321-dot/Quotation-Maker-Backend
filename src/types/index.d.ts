import { JwtPayload } from "jsonwebtoken";

export interface UserPayload extends JwtPayload {
  email: string;
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      id?: string;
    }
  }
}
