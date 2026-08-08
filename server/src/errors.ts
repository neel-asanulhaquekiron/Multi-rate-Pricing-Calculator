import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

/**
 * Error handling: ONE converter from thrown errors to HTTP.
 *
 *   route/service throws          errorHandler maps to
 *   ─────────────────────────────────────────────────────────
 *   AppError(status, code, msg) → status  { code, message }
 *   ZodError                    → 400     { code: VALIDATION_ERROR, message, details }
 *   anything else               → 500     { code: INTERNAL_ERROR }   (never leaks internals)
 *
 * Routes never build error responses themselves — they throw.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Express 4 does not catch rejected promises — wrap async handlers. */
export const wrap = (
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join(".") || undefined,
      message: issue.message,
    }));
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: details[0]?.message ?? "invalid input",
      details,
    });
    return;
  }
  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "something went wrong" });
};
