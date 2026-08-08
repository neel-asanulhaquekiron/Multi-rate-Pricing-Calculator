import type { Prisma, PrismaClient } from "@prisma/client";
import {
  calcDocument,
  calcLine,
  dateToYmd,
  ymdToDate,
  MAX_TOTAL_CENTS,
  type Discount,
  type DocumentInput,
  type LineInput,
  type LineItemInput,
} from "../../../shared/src";
import { prisma } from "../db";
import { AppError } from "../errors";

/**
 * Document service — the single chokepoint for every document/line mutation.
 *
 *   route ─▶ service ─▶ getOwnedDocument (userId scope; 404 if not yours)
 *                    ─▶ assertDraft      (409 DOCUMENT_FINALIZED on any write)
 *                    ─▶ $transaction:
 *                         mutate line rows (calcLine outputs persisted per line)
 *                         recompute doc totals from RAW inputs via calcDocument
 *                         reject totals that would overflow Int4 columns
 *
 * Nothing else in the codebase touches Document/LineItem rows.
 */

type Tx = Prisma.TransactionClient | PrismaClient;

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINE_ORDER = [{ createdAt: "asc" }, { id: "asc" }] as const satisfies Prisma.LineItemOrderByWithRelationInput[];

type DocumentRow = Prisma.DocumentGetPayload<Record<string, never>>;
type LineRow = Prisma.LineItemGetPayload<Record<string, never>>;

const notFound = (): AppError => {
  return new AppError(404, "NOT_FOUND", "document not found");
};

const rowToDiscount = (row: LineRow): Discount => {
  if (row.discountType === "percent") {
    return { type: "percent", bp: row.discountValue ?? 0 };
  }
  if (row.discountType === "fixed") {
    return { type: "fixed", cents: row.discountValue ?? 0 };
  }
  return null;
};

const rowToCalcInput = (row: LineRow): LineInput => {
  return {
    quantity: row.quantity,
    unitPriceCents: row.unitPriceCents,
    discount: rowToDiscount(row),
    taxBp: row.taxBp,
  };
};

const lineDto = (row: LineRow) => {
  return {
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    unitPriceCents: row.unitPriceCents,
    discount: rowToDiscount(row),
    taxBp: row.taxBp,
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    taxCents: row.taxCents,
    totalCents: row.totalCents,
  };
};

const documentDto = (row: DocumentRow, lines?: LineRow[]) => {
  return {
    id: row.id,
    title: row.title,
    customer: row.customer,
    issueDate: dateToYmd(row.issueDate),
    status: row.status,
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    taxCents: row.taxCents,
    grandTotalCents: row.grandTotalCents,
    ...(lines !== undefined ? { lines: lines.map(lineDto) } : {}),
  };
};

export type DocumentDto = ReturnType<typeof documentDto>;
export type LineDto = ReturnType<typeof lineDto>;

/** Every read goes through here: id must be YOURS or it does not exist. */
const getOwnedDocument = async (tx: Tx, userId: string, documentId: string): Promise<DocumentRow> => {
  if (!uuidRe.test(documentId)) {
    throw notFound();
  }
  const doc = await tx.document.findFirst({ where: { id: documentId, userId } });
  if (!doc) {
    throw notFound();
  }
  return doc;
};

const assertDraft = (doc: DocumentRow): void => {
  if (doc.status === "finalized") {
    throw new AppError(409, "DOCUMENT_FINALIZED", "finalized documents cannot be modified");
  }
};

const lineInputToColumns = (input: LineItemInput) => {
  const totals = calcLine(input);
  return {
    description: input.description,
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
    discountType: input.discount?.type ?? null,
    discountValue: input.discount === null ? null : input.discount.type === "percent" ? input.discount.bp : input.discount.cents,
    taxBp: input.taxBp,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
  };
};

/** Recompute document totals from raw line inputs — decision 5A. */
const recomputeTotals = async (tx: Tx, documentId: string): Promise<void> => {
  const rows = await tx.lineItem.findMany({ where: { documentId }, orderBy: [...LINE_ORDER] });
  const totals = calcDocument(rows.map(rowToCalcInput));
  if (totals.subtotalCents > MAX_TOTAL_CENTS || totals.grandTotalCents > MAX_TOTAL_CENTS) {
    throw new AppError(400, "DOCUMENT_TOO_LARGE", "document totals exceed the supported maximum");
  }
  await tx.document.update({
    where: { id: documentId },
    data: {
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      taxCents: totals.taxCents,
      grandTotalCents: totals.grandTotalCents,
    },
  });
};

export const listDocuments = async (userId: string): Promise<DocumentDto[]> => {
  const rows = await prisma.document.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((row) => documentDto(row));
};

export const getDocument = async (userId: string, documentId: string): Promise<DocumentDto> => {
  const doc = await getOwnedDocument(prisma, userId, documentId);
  const lines = await prisma.lineItem.findMany({ where: { documentId: doc.id }, orderBy: [...LINE_ORDER] });
  return documentDto(doc, lines);
};

export const createDocument = async (userId: string, input: DocumentInput): Promise<DocumentDto> => {
  const row = await prisma.document.create({
    data: { userId, title: input.title, customer: input.customer, issueDate: ymdToDate(input.issueDate) },
  });
  return documentDto(row, []);
};

export const updateDocument = async (userId: string, documentId: string, input: DocumentInput): Promise<DocumentDto> => {
  const doc = await getOwnedDocument(prisma, userId, documentId);
  assertDraft(doc);
  const row = await prisma.document.update({
    where: { id: doc.id },
    data: { title: input.title, customer: input.customer, issueDate: ymdToDate(input.issueDate) },
  });
  const lines = await prisma.lineItem.findMany({ where: { documentId: doc.id }, orderBy: [...LINE_ORDER] });
  return documentDto(row, lines);
};

export const deleteDocument = async (userId: string, documentId: string): Promise<void> => {
  const doc = await getOwnedDocument(prisma, userId, documentId);
  // Decision 13A: finalized means immutable INCLUDING delete.
  assertDraft(doc);
  await prisma.document.delete({ where: { id: doc.id } });
};

export const addLine = async (userId: string, documentId: string, input: LineItemInput): Promise<DocumentDto> => {
  await prisma.$transaction(async (tx) => {
    const doc = await getOwnedDocument(tx, userId, documentId);
    assertDraft(doc);
    await tx.lineItem.create({ data: { documentId: doc.id, ...lineInputToColumns(input) } });
    await recomputeTotals(tx, doc.id);
  });
  return getDocument(userId, documentId);
};

export const updateLine = async (
  userId: string,
  documentId: string,
  lineId: string,
  input: LineItemInput,
): Promise<DocumentDto> => {
  await prisma.$transaction(async (tx) => {
    const doc = await getOwnedDocument(tx, userId, documentId);
    assertDraft(doc);
    if (!uuidRe.test(lineId)) {
      throw new AppError(404, "LINE_NOT_FOUND", "line item not found");
    }
    const line = await tx.lineItem.findFirst({ where: { id: lineId, documentId: doc.id } });
    if (!line) {
      throw new AppError(404, "LINE_NOT_FOUND", "line item not found");
    }
    await tx.lineItem.update({ where: { id: line.id }, data: lineInputToColumns(input) });
    await recomputeTotals(tx, doc.id);
  });
  return getDocument(userId, documentId);
};

export const deleteLine = async (userId: string, documentId: string, lineId: string): Promise<DocumentDto> => {
  await prisma.$transaction(async (tx) => {
    const doc = await getOwnedDocument(tx, userId, documentId);
    assertDraft(doc);
    const line = uuidRe.test(lineId) ? await tx.lineItem.findFirst({ where: { id: lineId, documentId: doc.id } }) : null;
    if (!line) {
      throw new AppError(404, "LINE_NOT_FOUND", "line item not found");
    }
    await tx.lineItem.delete({ where: { id: line.id } });
    await recomputeTotals(tx, doc.id);
  });
  return getDocument(userId, documentId);
};

export const finalizeDocument = async (userId: string, documentId: string): Promise<DocumentDto> => {
  await prisma.$transaction(async (tx) => {
    const doc = await getOwnedDocument(tx, userId, documentId);
    assertDraft(doc);

    // Decision 8A — defense-in-depth: schema + zod already forbid these, but
    // finalize is the last gate before immutability, so it re-checks the rows
    // actually in the database (its test seeds a bad row bypassing the API).
    const lines = await tx.lineItem.findMany({ where: { documentId: doc.id }, orderBy: [...LINE_ORDER] });
    for (const line of lines) {
      if (line.quantity < 1) {
        throw new AppError(400, "CANNOT_FINALIZE", `cannot finalize: line "${line.description}" has quantity ${line.quantity} (must be ≥ 1)`);
      }
      if (line.unitPriceCents < 0) {
        throw new AppError(400, "CANNOT_FINALIZE", `cannot finalize: line "${line.description}" has a negative unit price`);
      }
    }

    await tx.document.update({ where: { id: doc.id }, data: { status: "finalized" } });
  });
  return getDocument(userId, documentId);
};

export const duplicateDocument = async (userId: string, documentId: string, issueDateYmd: string): Promise<DocumentDto> => {
  let newId = "";
  await prisma.$transaction(async (tx) => {
    // Duplicate works on ANY status (decision 13A) — it never mutates the source.
    const source = await getOwnedDocument(tx, userId, documentId);
    const lines = await tx.lineItem.findMany({ where: { documentId: source.id }, orderBy: [...LINE_ORDER] });

    const base = Date.now();
    const created = await tx.document.create({
      data: {
        userId,
        title: `${source.title} (copy)`,
        customer: source.customer,
        issueDate: ymdToDate(issueDateYmd),
        status: "draft",
        subtotalCents: source.subtotalCents,
        discountCents: source.discountCents,
        taxCents: source.taxCents,
        grandTotalCents: source.grandTotalCents,
        lines: {
          // Copied inputs AND computed cents are identical; staggered createdAt
          // preserves display order (decision 12B).
          create: lines.map((line, i) => ({
            description: line.description,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            discountType: line.discountType,
            discountValue: line.discountValue,
            taxBp: line.taxBp,
            subtotalCents: line.subtotalCents,
            discountCents: line.discountCents,
            taxCents: line.taxCents,
            totalCents: line.totalCents,
            createdAt: new Date(base + i),
          })),
        },
      },
    });
    newId = created.id;
  });
  return getDocument(userId, newId);
};
