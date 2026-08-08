import { ymdToDate } from "../../../shared/src";
import { prisma } from "../db";

/**
 * Summary report makes this one SQL aggregate over the persisted
 * document totals (recomputed transactionally on every write), instead of
 * re-running the math over every line item. Decision 9A fixes the semantics:
 * ALL documents count (drafts included), filter on issueDate, boundaries
 * inclusive. The report ≡ Σ documents invariant is enforced by test.
 */
export interface ReportSummary {
  documentCount: number;
  grandTotalCents: number;
  taxCents: number;
  discountCents: number;
}

export const getSummary = async (
  userId: string,
  fromYmd: string,
  toYmd: string,
  status: "all" | "finalized" = "all",
): Promise<ReportSummary> => {
  const result = await prisma.document.aggregate({
    where: {
      userId,
      issueDate: { gte: ymdToDate(fromYmd), lte: ymdToDate(toYmd) },
      ...(status === "finalized" ? { status: "finalized" as const } : {}),
    },
    _count: { _all: true },
    _sum: { grandTotalCents: true, taxCents: true, discountCents: true },
  });

  return {
    documentCount: result._count._all,
    grandTotalCents: result._sum.grandTotalCents ?? 0,
    taxCents: result._sum.taxCents ?? 0,
    discountCents: result._sum.discountCents ?? 0,
  };
};
