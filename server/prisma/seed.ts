/**
 * Seed: demo login + the assignment's sample document, so a reviewer can sign
 * straight in and see the worked example from the README live.
 *
 * Idempotent: re-running wipes and recreates only the demo user's data.
 * Run with: npm run seed -w server
 */
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { calcLine, ymdToDate, type LineInput } from "shared";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";

/** The spec's sample document (see README worked example). */
const sampleLines: { description: string; input: LineInput }[] = [
  {
    description: "Widget A",
    input: { quantity: 2, unitPriceCents: 10000, discount: { type: "percent", bp: 1000 }, taxBp: 500 },
  },
  {
    description: "Widget B",
    input: { quantity: 1, unitPriceCents: 5000, discount: null, taxBp: 500 },
  },
  {
    description: "Service fee",
    input: { quantity: 1, unitPriceCents: 20000, discount: { type: "fixed", cents: 2000 }, taxBp: null },
  },
];

const main = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, passwordHash },
  });

  // Reset the demo user's documents so the seed is idempotent.
  await prisma.document.deleteMany({ where: { userId: user.id } });

  const perLine = sampleLines.map(({ description, input }) => ({ description, input, totals: calcLine(input) }));
  const docTotals = perLine.reduce(
    (acc, { totals }) => ({
      subtotalCents: acc.subtotalCents + totals.subtotalCents,
      discountCents: acc.discountCents + totals.discountCents,
      taxCents: acc.taxCents + totals.taxCents,
      grandTotalCents: acc.grandTotalCents + totals.totalCents,
    }),
    { subtotalCents: 0, discountCents: 0, taxCents: 0, grandTotalCents: 0 },
  );

  // Explicit createdAt increments keep line order stable (decision 12B:
  // display order is createdAt, id).
  const base = Date.now();
  const lines: Prisma.LineItemCreateWithoutDocumentInput[] = perLine.map(({ description, input, totals }, i) => ({
    description,
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
    discountType: input.discount ? input.discount.type : null,
    discountValue: input.discount ? (input.discount.type === "percent" ? input.discount.bp : input.discount.cents) : null,
    taxBp: input.taxBp ?? null,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    createdAt: new Date(base + i * 1000),
  }));

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      title: "Sample quote",
      customer: "Acme Corp",
      issueDate: ymdToDate("2026-08-08"),
      status: "draft",
      ...docTotals,
      lines: { create: lines },
    },
    include: { lines: true },
  });

  console.log(`Seeded ${DEMO_EMAIL} / ${DEMO_PASSWORD} with document "${doc.title}" (${doc.lines.length} lines, grand total ${doc.grandTotalCents} cents)`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
