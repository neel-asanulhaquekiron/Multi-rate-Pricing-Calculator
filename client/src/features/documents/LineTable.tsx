import { formatMoney, formatPercent } from "shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteLineButton } from "@/features/documents/DeleteLineButton";
import { discountLabel } from "@/features/documents/discountLabel";
import { EditLineDialog } from "@/features/documents/EditLineDialog";
import type { DocumentDto } from "@/lib/types";

interface LineTableProps {
  doc: DocumentDto;
  /** Omit for read-only rendering (finalized docs, print view). */
  onChange?: (doc: DocumentDto) => void;
  onError?: (message: string) => void;
}

/** Line items with their server-computed amounts (order = createdAt, id). */
export const LineTable = ({ doc, onChange, onError }: LineTableProps) => {
  const lines = doc.lines ?? [];
  const editable = doc.status === "draft" && onChange !== undefined;

  if (lines.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        No line items yet — add the first one above.
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
          {editable && <TableHead className="w-20" />}
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
            {editable && (
              <TableCell>
                <div className="flex justify-end">
                  <EditLineDialog doc={doc} line={line} onChange={onChange} />
                  <DeleteLineButton doc={doc} line={line} onChange={onChange} onError={onError ?? (() => {})} />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
