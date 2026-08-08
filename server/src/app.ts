import express from "express";
import { prisma } from "./db";

// The app is EXPORTED and never calls listen() here — Vercel wraps it as a
// serverless function (api/index.ts); local dev uses src/local.ts instead.
export const app = express();

app.use(express.json());

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
