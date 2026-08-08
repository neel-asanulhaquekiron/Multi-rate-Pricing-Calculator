import cookieParser from "cookie-parser";
import express from "express";
import { prisma } from "./db";
import { errorHandler } from "./errors";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./routes/auth";
import { documentsRouter } from "./routes/documents";

// The app is EXPORTED and never calls listen() here — Vercel wraps it as a
// serverless function (api/index.ts); local dev uses src/local.ts instead.
//
// Request flow:
//   request → express.json → cookieParser → router → (throw) → errorHandler
//                                            └→ requireAuth → req.userId on protected routes
export const app = express();

app.use(express.json());
app.use(cookieParser());

// Health does a REAL database read (decision 11A): proves the pooled connection
// works, and the daily Vercel cron hitting this keeps the free-tier DB from
// pausing before the assignment is graded (decision 7A).
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/documents", requireAuth, documentsRouter);

// Unknown API paths get a JSON 404, not an HTML error page.
app.use("/api", (_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "no such endpoint" });
});

// Must be registered last — decision 3A: the single error-to-HTTP converter.
app.use(errorHandler);
