import { describe, expect, it } from "vitest";
import { calcDocument, calcLine, type LineInput } from "./calc";

/**
 * Sample document from the assignment PDF (page 2-3). Expected values assume
 * round-half-up to 2 decimal places per line — reproduced here to the cent.
 *
 *   Line        Qty  Unit price  Discount   Tax   || Subtotal  Disc   After   Tax   Total
 *   Widget A     2     100.00      10%       5%   ||  200.00  20.00  180.00  9.00  189.00
 *   Widget B     1      50.00       —        5%   ||   50.00   0.00   50.00  2.50   52.50
 *   Service fee  1     200.00     $20 fixed  —    ||  200.00  20.00  180.00  0.00  180.00
 */
const widgetA: LineInput = { quantity: 2, unitPriceCents: 10000, discount: { type: "percent", bp: 1000 }, taxBp: 500 };
const widgetB: LineInput = { quantity: 1, unitPriceCents: 5000, discount: null, taxBp: 500 };
const serviceFee: LineInput = { quantity: 1, unitPriceCents: 20000, discount: { type: "fixed", cents: 2000 }, taxBp: null };

describe("spec sample document", () => {
  it("Widget A: 2 x 100.00, 10% discount, 5% tax", () => {
    expect(calcLine(widgetA)).toEqual({
      subtotalCents: 20000,
      discountCents: 2000,
      afterDiscountCents: 18000,
      taxCents: 900, // 5% of 180.00 (discounted amount), NOT of 200.00
      totalCents: 18900,
    });
  });

  it("Widget B: 1 x 50.00, no discount, 5% tax", () => {
    expect(calcLine(widgetB)).toEqual({
      subtotalCents: 5000,
      discountCents: 0,
      afterDiscountCents: 5000,
      taxCents: 250,
      totalCents: 5250,
    });
  });

  it("Service fee: 1 x 200.00, $20 fixed discount, no tax", () => {
    expect(calcLine(serviceFee)).toEqual({
      subtotalCents: 20000,
      discountCents: 2000,
      afterDiscountCents: 18000,
      taxCents: 0,
      totalCents: 18000,
    });
  });

  it("document totals: 450.00 / 40.00 / 11.50 / 421.50", () => {
    expect(calcDocument([widgetA, widgetB, serviceFee])).toEqual({
      subtotalCents: 45000,
      discountCents: 4000,
      taxCents: 1150,
      grandTotalCents: 42150,
    });
  });
});

describe("calcLine edge cases", () => {
  it("no discount, no tax", () => {
    expect(calcLine({ quantity: 3, unitPriceCents: 999 })).toEqual({
      subtotalCents: 2997,
      discountCents: 0,
      afterDiscountCents: 2997,
      taxCents: 0,
      totalCents: 2997,
    });
  });

  it("0% discount is a no-op", () => {
    const t = calcLine({ quantity: 1, unitPriceCents: 5000, discount: { type: "percent", bp: 0 }, taxBp: 500 });
    expect(t.discountCents).toBe(0);
    expect(t.totalCents).toBe(5250);
  });

  it("100% discount zeroes the line, tax on 0 is 0", () => {
    const t = calcLine({ quantity: 2, unitPriceCents: 10000, discount: { type: "percent", bp: 10000 }, taxBp: 500 });
    expect(t).toEqual({ subtotalCents: 20000, discountCents: 20000, afterDiscountCents: 0, taxCents: 0, totalCents: 0 });
  });

  it("fixed discount equal to subtotal zeroes the line", () => {
    const t = calcLine({ quantity: 1, unitPriceCents: 5000, discount: { type: "fixed", cents: 5000 }, taxBp: 500 });
    expect(t).toEqual({ subtotalCents: 5000, discountCents: 5000, afterDiscountCents: 0, taxCents: 0, totalCents: 0 });
  });

  it("fixed discount above subtotal clamps (defense-in-depth; validation rejects it upstream)", () => {
    const t = calcLine({ quantity: 1, unitPriceCents: 5000, discount: { type: "fixed", cents: 8000 } });
    expect(t.discountCents).toBe(5000);
    expect(t.afterDiscountCents).toBe(0);
    expect(t.totalCents).toBe(0);
  });

  it("unit price 0 yields all-zero amounts", () => {
    const t = calcLine({ quantity: 5, unitPriceCents: 0, discount: { type: "percent", bp: 1000 }, taxBp: 725 });
    expect(t).toEqual({ subtotalCents: 0, discountCents: 0, afterDiscountCents: 0, taxCents: 0, totalCents: 0 });
  });

  it("rounds tax half-up: 3 x 33.33 at 7.25% -> tax 7.25 (724.9275 rounds to 725)", () => {
    const t = calcLine({ quantity: 3, unitPriceCents: 3333, taxBp: 725 });
    expect(t.subtotalCents).toBe(9999);
    expect(t.taxCents).toBe(725);
    expect(t.totalCents).toBe(10724);
  });

  it("rounds an exact half-cent UP: 5% of 0.10 = 0.005 -> 0.01", () => {
    const t = calcLine({ quantity: 1, unitPriceCents: 10, taxBp: 500 });
    expect(t.taxCents).toBe(1);
  });

  it("rounds discount half-up: 10% of 0.25 = 0.025 -> 0.03", () => {
    const t = calcLine({ quantity: 1, unitPriceCents: 25, discount: { type: "percent", bp: 1000 } });
    expect(t.discountCents).toBe(3);
    expect(t.afterDiscountCents).toBe(22);
  });

  it("handles large but realistic values exactly", () => {
    const t = calcLine({ quantity: 1_000_000, unitPriceCents: 99_999, discount: { type: "percent", bp: 333 }, taxBp: 725 });
    expect(t.subtotalCents).toBe(99_999_000_000);
    // 3.33% of 99,999,000,000 = 3,329,966,700 exactly
    expect(t.discountCents).toBe(3_329_966_700);
    expect(t.totalCents).toBe(t.afterDiscountCents + t.taxCents);
  });
});

describe("calcLine input validation", () => {
  it.each([
    ["quantity 0", { quantity: 0, unitPriceCents: 100 }],
    ["negative quantity", { quantity: -1, unitPriceCents: 100 }],
    ["fractional quantity", { quantity: 1.5, unitPriceCents: 100 }],
    ["negative unit price", { quantity: 1, unitPriceCents: -100 }],
    ["fractional cents", { quantity: 1, unitPriceCents: 100.5 }],
    ["discount bp above 100%", { quantity: 1, unitPriceCents: 100, discount: { type: "percent", bp: 10001 } }],
    ["negative discount bp", { quantity: 1, unitPriceCents: 100, discount: { type: "percent", bp: -1 } }],
    ["fractional discount bp", { quantity: 1, unitPriceCents: 100, discount: { type: "percent", bp: 72.5 } }],
    ["negative fixed discount", { quantity: 1, unitPriceCents: 100, discount: { type: "fixed", cents: -5 } }],
    ["tax bp above 100%", { quantity: 1, unitPriceCents: 100, taxBp: 10001 }],
    ["negative tax bp", { quantity: 1, unitPriceCents: 100, taxBp: -1 }],
  ] as [string, LineInput][])("rejects %s", (_name, input) => {
    expect(() => calcLine(input)).toThrow(RangeError);
  });

  it("rejects unsafe-integer subtotals instead of silently losing precision", () => {
    expect(() => calcLine({ quantity: 2 ** 40, unitPriceCents: 2 ** 40 })).toThrow(RangeError);
  });
});

describe("calcDocument", () => {
  it("returns zeros for an empty document", () => {
    expect(calcDocument([])).toEqual({ subtotalCents: 0, discountCents: 0, taxCents: 0, grandTotalCents: 0 });
  });

  it("upholds grandTotal === subtotal - discount + tax across mixed lines", () => {
    const lines: LineInput[] = [
      widgetA,
      widgetB,
      serviceFee,
      { quantity: 7, unitPriceCents: 1234, discount: { type: "percent", bp: 725 }, taxBp: 1450 },
      { quantity: 1, unitPriceCents: 1, discount: { type: "fixed", cents: 1 }, taxBp: 10000 },
    ];
    const d = calcDocument(lines);
    expect(d.grandTotalCents).toBe(d.subtotalCents - d.discountCents + d.taxCents);
  });

  it("document totals are the exact sums of per-line results", () => {
    const lines = [widgetA, widgetB, serviceFee];
    const perLine = lines.map(calcLine);
    const d = calcDocument(lines);
    expect(d.subtotalCents).toBe(perLine.reduce((s, t) => s + t.subtotalCents, 0));
    expect(d.discountCents).toBe(perLine.reduce((s, t) => s + t.discountCents, 0));
    expect(d.taxCents).toBe(perLine.reduce((s, t) => s + t.taxCents, 0));
    expect(d.grandTotalCents).toBe(perLine.reduce((s, t) => s + t.totalCents, 0));
  });
});
