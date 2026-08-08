import type { DocumentDto, LineDto } from "@/lib/types";

export const lineFixture = (overrides: Partial<LineDto> = {}): LineDto => {
  return {
    id: "11111111-1111-4111-8111-000000000001",
    description: "Widget A",
    quantity: 2,
    unitPriceCents: 10000,
    discount: { type: "percent", bp: 1000 },
    taxBp: 500,
    subtotalCents: 20000,
    discountCents: 2000,
    taxCents: 900,
    totalCents: 18900,
    ...overrides,
  };
};

export const docFixture = (overrides: Partial<DocumentDto> = {}): DocumentDto => {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Test quote",
    customer: "Acme Corp",
    issueDate: "2026-08-08",
    status: "draft",
    subtotalCents: 20000,
    discountCents: 2000,
    taxCents: 900,
    grandTotalCents: 18900,
    lines: [lineFixture()],
    ...overrides,
  };
};
