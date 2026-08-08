import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, verifyToken } from "../auth";
import { AppError } from "../errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireAuth; every data query MUST be scoped by this. */
      userId?: string;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = verifyToken(req.cookies?.[AUTH_COOKIE]);
  if (!userId) {
    next(new AppError(401, "UNAUTHORIZED", "authentication required"));
    return;
  }
  req.userId = userId;
  next();
};
