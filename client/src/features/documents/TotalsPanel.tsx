import { formatMoney } from "shared";
import { Separator } from "@/components/ui/separator";

interface TotalsPanelProps {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
  /** e.g. "preview" while typing (6.4.4); omitted = server-confirmed values. */
  label?: string;
}

/** Document totals block — used by the editor and the printable view. */
export const TotalsPanel = ({ subtotalCents, discountCents, taxCents, grandTotalCents, label }: TotalsPanelProps) => {
  return (
    <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      {label && <p className="text-right text-xs text-muted-foreground italic">{label}</p>}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">${formatMoney(subtotalCents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total discount</span>
        <span className="tabular-nums">−${formatMoney(discountCents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total tax</span>
        <span className="tabular-nums">+${formatMoney(taxCents)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Grand total</span>
        <span className="tabular-nums">${formatMoney(grandTotalCents)}</span>
      </div>
    </div>
  );
};
