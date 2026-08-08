import bcrypt from "bcryptjs";
import { Router } from "express";
// Relative import (not the bare "shared" specifier): Vercel's function compiler
// only compiles TypeScript it can trace through relative paths — a bare import
// resolves to the workspace package whose main is a .ts file Node can't load.
import { loginSchema, signupSchema } from "../../../shared/src";
import { clearAuthCookie, setAuthCookie } from "../auth";
import { prisma } from "../db";
import { AppError, wrap } from "../errors";
import { requireAuth } from "../middleware/requireAuth";

const BCRYPT_COST = 10;

export const authRouter = Router();

authRouter.post(
  "/signup",
  wrap(async (req, res) => {
    const { email, password } = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "EMAIL_TAKEN", "an account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    setAuthCookie(res, user.id);
    res.status(201).json({ user: { id: user.id, email: user.email } });
  }),
);

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    // Same error for unknown email and wrong password — the response must not
    // reveal which emails have accounts.
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordOk = user !== null && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !passwordOk) {
      throw new AppError(401, "INVALID_CREDENTIALS", "invalid email or password");
    }

    setAuthCookie(res, user.id);
    res.json({ user: { id: user.id, email: user.email } });
  }),
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      // Token is valid but the account is gone — treat as signed out.
      throw new AppError(401, "UNAUTHORIZED", "authentication required");
    }
    res.json({ user: { id: user.id, email: user.email } });
  }),
);
