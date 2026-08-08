/**
 * Dollar/percent string helpers — the ONLY place dollars exist.
 * Everything past the UI edge is integer cents / basis points (see calc.ts).
 */

const MONEY_RE = /^(\d+)(?:\.(\d{1,2}))?$/;
const PERCENT_RE = /^(\d+)(?:\.(\d{1,2}))?$/;

/** "100", "100.5", "100.00" -> cents. Throws on anything else (incl. negatives). */
export const parseMoney = (input: string): number => {
  const match = MONEY_RE.exec(input.trim());
  if (!match) {
    throw new RangeError(`invalid money amount "${input}" — expected a non-negative number with at most 2 decimal places`);
  }
  const whole = Number(match[1]);
  const frac = Number((match[2] ?? "").padEnd(2, "0") || "0");
  const cents = whole * 100 + frac;
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`money amount "${input}" is too large`);
  }
  return cents;
};

/** 10000 -> "100.00" */
export const formatMoney = (cents: number): string => {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`cents must be a safe integer, got ${cents}`);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
};

/** "7.25" -> 725 bp. 0-100 only, max 2 decimal places. */
export const parsePercent = (input: string): number => {
  const match = PERCENT_RE.exec(input.trim());
  if (!match) {
    throw new RangeError(`invalid percent "${input}" — expected a number between 0 and 100 with at most 2 decimal places`);
  }
  const bp = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  if (bp > 10000) {
    throw new RangeError(`percent must be between 0 and 100, got ${input}`);
  }
  return bp;
};

/** 725 -> "7.25", 500 -> "5" */
export const formatPercent = (bp: number): string => {
  if (!Number.isSafeInteger(bp) || bp < 0) {
    throw new RangeError(`bp must be a non-negative integer, got ${bp}`);
  }
  const whole = Math.floor(bp / 100);
  const frac = bp % 100;
  if (frac === 0) {
    return String(whole);
  }
  return `${whole}.${String(frac).padStart(2, "0").replace(/0$/, "")}`;
};
