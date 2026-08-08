import jwt from "jsonwebtoken";
import type { Response } from "express";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const AUTH_COOKIE = "token";

const jwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
};

export const signToken = (userId: string): string => {
  return jwt.sign({}, jwtSecret(), { subject: userId, expiresIn: TOKEN_TTL_SECONDS });
};

/** Returns the userId, or null for missing/garbage/expired/foreign tokens. */
export const verifyToken = (token: string | undefined): string | null => {
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
};

export const setAuthCookie = (res: Response, userId: string): void => {
  res.cookie(AUTH_COOKIE, signToken(userId), {
    httpOnly: true, // JS can never read it — XSS cannot steal the session
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // cross-site POSTs won't carry it — baseline CSRF defence
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
};
