import { Router } from "express";
import { reportQuerySchema } from "../../../shared/src";
import { wrap } from "../errors";
import * as reports from "../services/reportService";

/** Mounted behind requireAuth (see app.ts). */
export const reportsRouter = Router();

reportsRouter.get(
  "/summary",
  wrap(async (req, res) => {
    const { from, to, status } = reportQuerySchema.parse(req.query);
    res.json({ summary: await reports.getSummary(req.userId as string, from, to, status) });
  }),
);
