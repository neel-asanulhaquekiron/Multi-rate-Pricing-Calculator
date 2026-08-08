import express from "express";

// The app is EXPORTED and never calls listen() here — Vercel wraps it as a
// serverless function (api/index.ts); local dev uses src/local.ts instead.
export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
