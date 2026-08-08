/**
 * Calculation module — the single source of truth for all money math.
 *
 * Units: every amount is an INTEGER number of cents; every percent is an
 * INTEGER number of basis points (bp): 7.25% -> 725, 100% -> 10000.
 * No floating-point arithmetic ever touches a money value.
 *
 * Per-line pipeline (round-half-up at each * step):
 *
 *   subtotal      = quantity x unitPriceCents
 *   discount      = fixed:   min(cents, subtotal)        <- defensive clamp;
 *                                                           validation rejects
 *                                                           fixed > subtotal first
 *                   percent: round*(subtotal x bp / 10000)
 *   afterDiscount = subtotal - discount
 *   tax           = round*(afterDiscount x taxBp / 10000)
 *   lineTotal     = afterDiscount + tax
 *
 * Document totals are plain sums over lines, so the identity
 *   grandTotal === subtotal - totalDiscount + totalTax
 * holds exactly.
 */

/** A line's discount. The union makes "percent AND fixed" unrepresentable. */
export type Discount =
  | { type: "percent"; bp: number }
  | { type: "fixed"; cents: number }
  | null;

export interface LineInput {
  quantity: number;
  unitPriceCents: number;
  discount?: Discount;
  /** Tax in basis points (7.25% -> 725). null/undefined means no tax. */
  taxBp?: number | null;
}

export interface LineTotals {
  subtotalCents: number;
  discountCents: number;
  afterDiscountCents: number;
  taxCents: number;
  totalCents: number;
}

export interface DocumentTotals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
}

const BP_SCALE = 10000;

const assertSafeInteger = (value: number, name: string): void => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer, got ${value}`);
  }
};

const assertBpRange = (value: number, name: string): void => {
  assertSafeInteger(value, name);
  if (value < 0 || value > BP_SCALE) {
    throw new RangeError(`${name} must be between 0 and ${BP_SCALE} basis points (0-100%), got ${value}`);
  }
};

/**
 * round(n / d) with halves rounding up, in pure integer arithmetic.
 * Requires n >= 0 and d an even positive integer (we only divide by 10000),
 * so `(n + d/2) / d` floored is exact — no float error can occur.
 */
const roundHalfUpRatio = (n: number, d: number): number => {
  assertSafeInteger(n, "numerator");
  return Math.floor((n + d / 2) / d);
};

/** Compute all derived amounts for a single line. Pure; throws on invalid input. */
export const calcLine = (input: LineInput): LineTotals => {
  const { quantity, unitPriceCents } = input;
  const discount = input.discount ?? null;
  const taxBp = input.taxBp ?? null;

  assertSafeInteger(quantity, "quantity");
  if (quantity < 1) {
    throw new RangeError(`quantity must be >= 1, got ${quantity}`);
  }
  assertSafeInteger(unitPriceCents, "unitPriceCents");
  if (unitPriceCents < 0) {
    throw new RangeError(`unitPriceCents must be >= 0, got ${unitPriceCents}`);
  }

  const subtotalCents = quantity * unitPriceCents;
  assertSafeInteger(subtotalCents, "line subtotal");

  let discountCents = 0;
  if (discount !== null) {
    if (discount.type === "percent") {
      assertBpRange(discount.bp, "discount.bp");
      discountCents = roundHalfUpRatio(subtotalCents * discount.bp, BP_SCALE);
    } else {
      assertSafeInteger(discount.cents, "discount.cents");
      if (discount.cents < 0) {
        throw new RangeError(`discount.cents must be >= 0, got ${discount.cents}`);
      }
      // Defensive clamp: API validation rejects fixed > subtotal before this
      // point, but the invariant "a line can never go negative" holds here too.
      discountCents = Math.min(discount.cents, subtotalCents);
    }
  }

  const afterDiscountCents = subtotalCents - discountCents;

  let taxCents = 0;
  if (taxBp !== null) {
    assertBpRange(taxBp, "taxBp");
    taxCents = roundHalfUpRatio(afterDiscountCents * taxBp, BP_SCALE);
  }

  return {
    subtotalCents,
    discountCents,
    afterDiscountCents,
    taxCents,
    totalCents: afterDiscountCents + taxCents,
  };
};

/** Document totals are sums of the per-line results. */
export const calcDocument = (lines: LineInput[]): DocumentTotals => {
  let subtotalCents = 0;
  let discountCents = 0;
  let taxCents = 0;
  let grandTotalCents = 0;

  for (const line of lines) {
    const t = calcLine(line);
    subtotalCents += t.subtotalCents;
    discountCents += t.discountCents;
    taxCents += t.taxCents;
    grandTotalCents += t.totalCents;
  }
  assertSafeInteger(grandTotalCents, "document grand total");

  return { subtotalCents, discountCents, taxCents, grandTotalCents };
};
