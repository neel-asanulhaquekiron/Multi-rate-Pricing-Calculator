# Multi-Rate Pricing Calculator

Create documents with line items, apply per-line discounts and tax, and view
date-range summary reports. Totals are computed **server-side** by a single
shared calculation module.

**Live URL:** https://multi-rate-pricing-calculator-serve-psi.vercel.app

> README in progress — setup instructions, API reference, and lifecycle rules
> land with the final submission. The calculation policy below is final.

## Calculation & rounding policy

**Representation.** Money never exists as a float anywhere in the system:

- All amounts are **integer cents** (`100.00` → `10000`) — in Postgres columns,
  in the API JSON, and in the calculation module.
- All percents are **integer basis points** (`7.25%` → `725`).
- Dollars/percent strings exist only at the UI edge (`shared/src/money.ts`
  converts, and is unit-tested both directions).

**Rounding.** Round **half-up to the nearest cent, per line, at each derived
step** (discount amount, then tax amount). Implemented as pure integer
arithmetic — `floor((n + 5000) / 10000)` — so no floating-point error can
occur even at the rounding boundary. Document totals are exact sums of the
rounded per-line results, which makes this identity hold to the cent:

```
grand total  ===  subtotal − total discount + total tax
```

**Order of operations per line** (`shared/src/calc.ts`):

1. `subtotal = quantity × unit price`
2. Apply discount — **either** a fixed amount **or** a percent of the subtotal,
   never both (the type system makes the combination unrepresentable)
3. Apply tax percent **on the discounted amount**
4. `line total = discounted amount + tax`

**Worked example** (the assignment's sample document, reproduced exactly by
the test suite in `shared/src/calc.test.ts`):

| Line        | Qty | Unit price | Discount  | Tax | Subtotal | Discount | After discount | Tax amount | Line total |
|-------------|-----|-----------|-----------|-----|----------|----------|----------------|-----------|------------|
| Widget A    | 2   | 100.00    | 10%       | 5%  | 200.00   | 20.00    | 180.00         | 9.00      | 189.00     |
| Widget B    | 1   | 50.00     | —         | 5%  | 50.00    | 0.00     | 50.00          | 2.50      | 52.50      |
| Service fee | 1   | 200.00    | $20 fixed | —   | 200.00   | 20.00    | 180.00         | 0.00      | 180.00     |

Document totals: subtotal **450.00**, total discount **40.00**, total tax
**11.50**, grand total **421.50** (= 450.00 − 40.00 + 11.50).

Note Widget A's tax: 5% of **180.00** (the discounted amount), not of 200.00 —
discounts always apply before tax.

**Edge policies.**

- A fixed discount larger than the line subtotal is **rejected** by validation
  with a specific error; the calculation module additionally clamps defensively
  so a line can never go negative.
- Percent values are accepted in the range 0–100 with at most 2 decimal places.
- An exact half cent always rounds **up**: 5% of $0.10 = $0.005 → $0.01.

Run the calculation test suite: `npm test -w shared` (67 tests).
