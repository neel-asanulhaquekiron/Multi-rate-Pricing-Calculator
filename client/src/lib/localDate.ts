/**
 * Local-calendar date helpers: date-only values are the user's
 * LOCAL calendar date, never the server's UTC clock. All outputs YYYY-MM-DD.
 */

const localYmd = (date: Date): string => {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const todayYmd = (): string => {
  return localYmd(new Date());
};

/** First day of the browser's current local month. */
export const monthStartYmd = (): string => {
  return `${todayYmd().slice(0, 8)}01`;
};

/** The previous local month, first through last day. */
export const lastMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  return {
    from: localYmd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    // Day 0 of the current month = last day of the previous month.
    to: localYmd(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
};

/** January 1st of the browser's current local year. */
export const yearStartYmd = (): string => {
  return `${todayYmd().slice(0, 4)}-01-01`;
};
