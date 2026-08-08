/**
 * Date-only handling.
 *
 * An issue date like "2026-08-08" has no time and no timezone. JS Date forces
 * both, so a date-only value round-tripped through Date shifts by a day for
 * anyone west of UTC. The rule: the API, zod schemas, and React state carry
 * the plain "YYYY-MM-DD" string everywhere; ONLY the Prisma boundary converts,
 * using the UTC helpers below.
 */

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-08-08" -> Date at UTC midnight. Throws on bad format or impossible dates. */
export const ymdToDate = (ymd: string): Date => {
  const match = YMD_RE.exec(ymd);
  if (!match) {
    throw new RangeError(`invalid date "${ymd}" — expected YYYY-MM-DD`);
  }
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  // Date.UTC silently wraps impossible dates (2026-02-30 -> Mar 2); a strict
  // round-trip check turns that silent wrap into a loud error.
  if (dateToYmd(date) !== ymd) {
    throw new RangeError(`invalid date "${ymd}" — that day does not exist`);
  }
  return date;
};

/** Date -> "YYYY-MM-DD" using UTC fields (Prisma @db.Date values are UTC midnight). */
export const dateToYmd = (date: Date): string => {
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
