import { formatMoney } from "shared";
import type { LineTotals } from "shared";

interface LinePreviewProps {
  totals: LineTotals | null;
  /** Current server-confirmed grand total, in cents. */
  docGrandTotalCents: number;
}

/**
 * Live math for the line being typed — computed in the browser by the SAME
 * shared calc module the server runs, and clearly labeled a preview: the
 * saved numbers always come from the server's response.
 */
export const LinePreview = ({ totals, docGrandTotalCents }: LinePreviewProps) => {
  if (!totals) {
    return null;
  }
  return (
    <p className="text-right text-xs text-muted-foreground italic">
      Preview: {`$${formatMoney(totals.subtotalCents)}`}
      {totals.discountCents > 0 && ` − $${formatMoney(totals.discountCents)} discount`}
      {totals.taxCents > 0 && ` + $${formatMoney(totals.taxCents)} tax`}
      {" = "}
      <span className="font-medium not-italic">${formatMoney(totals.totalCents)}</span>
      {" line total · grand total becomes "}
      <span className="font-medium not-italic">${formatMoney(docGrandTotalCents + totals.totalCents)}</span>
      {" — server confirms on add"}
    </p>
  );
};
