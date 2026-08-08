// Vercel serverless entrypoint: wraps the Express app exported by server/src/app.
// vercel.json rewrites every /api/* request here; Express does its own routing.
import { app } from "../server/src/app";

export default app;
