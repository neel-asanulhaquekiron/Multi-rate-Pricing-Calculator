import { formatMoney, formatPercent } from "shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { discountLabel } from "@/features/documents/discountLabel";
import type { LineDto } from "@/lib/types";

interface LineTableProps {
  lines: LineDto[];
}

/** Line items with their server-computed amounts (order = createdAt, id — decision 12B). */
export const LineTable = ({ lines }: LineTableProps) => {
  if (lines.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        No line items yet — add the first one below.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit price</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-right">Tax</TableHead>
          <TableHead className="text-right">Line total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell className="font-medium">{line.description}</TableCell>
            <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
            <TableCell className="text-right tabular-nums">${formatMoney(line.unitPriceCents)}</TableCell>
            <TableCell className="text-right tabular-nums">{discountLabel(line.discount)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {line.taxBp === null ? "—" : `${formatPercent(line.taxBp)}%`}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">${formatMoney(line.totalCents)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
