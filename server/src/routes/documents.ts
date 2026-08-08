import { Router } from "express";
import { documentInputSchema, duplicateInputSchema, lineInputSchema } from "../../../shared/src";
import { wrap } from "../errors";
import * as documents from "../services/documentService";

/**
 * All routes are mounted behind requireAuth (see app.ts) — req.userId is set.
 * Routes only parse input and delegate; every rule lives in the service.
 */
export const documentsRouter = Router();

documentsRouter.get(
  "/",
  wrap(async (req, res) => {
    res.json({ documents: await documents.listDocuments(req.userId as string) });
  }),
);

documentsRouter.post(
  "/",
  wrap(async (req, res) => {
    const input = documentInputSchema.parse(req.body);
    res.status(201).json({ document: await documents.createDocument(req.userId as string, input) });
  }),
);

documentsRouter.get(
  "/:id",
  wrap(async (req, res) => {
    res.json({ document: await documents.getDocument(req.userId as string, req.params.id) });
  }),
);

documentsRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const input = documentInputSchema.parse(req.body);
    res.json({ document: await documents.updateDocument(req.userId as string, req.params.id, input) });
  }),
);

documentsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    await documents.deleteDocument(req.userId as string, req.params.id);
    res.status(204).end();
  }),
);

documentsRouter.post(
  "/:id/lines",
  wrap(async (req, res) => {
    const input = lineInputSchema.parse(req.body);
    res.status(201).json({ document: await documents.addLine(req.userId as string, req.params.id, input) });
  }),
);

documentsRouter.put(
  "/:id/lines/:lineId",
  wrap(async (req, res) => {
    const input = lineInputSchema.parse(req.body);
    res.json({ document: await documents.updateLine(req.userId as string, req.params.id, req.params.lineId, input) });
  }),
);

documentsRouter.delete(
  "/:id/lines/:lineId",
  wrap(async (req, res) => {
    res.json({ document: await documents.deleteLine(req.userId as string, req.params.id, req.params.lineId) });
  }),
);

documentsRouter.post(
  "/:id/finalize",
  wrap(async (req, res) => {
    res.json({ document: await documents.finalizeDocument(req.userId as string, req.params.id) });
  }),
);

documentsRouter.post(
  "/:id/duplicate",
  wrap(async (req, res) => {
    const { issueDate } = duplicateInputSchema.parse(req.body);
    res.status(201).json({ document: await documents.duplicateDocument(req.userId as string, req.params.id, issueDate) });
  }),
);
