/**
 * The BROWSER'S local today as YYYY-MM-DD — decision 10A: date-only values are
 * the user's local calendar date, never the server's UTC clock.
 */
export const todayYmd = (): string => {
  const now = new Date();
  const y = String(now.getFullYear()).padStart(4, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
