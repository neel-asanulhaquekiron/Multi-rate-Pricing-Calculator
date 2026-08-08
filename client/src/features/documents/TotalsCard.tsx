import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TotalsPanel } from "@/features/documents/TotalsPanel";
import type { DocumentDto } from "@/lib/types";

interface TotalsCardProps {
  doc: DocumentDto;
  pinned: boolean;
  onTogglePinned: () => void;
}

/**
 * Document totals with a position toggle: normally at the end of the page,
 * but on long documents one click moves it up next to the add-line form.
 */
export const TotalsCard = ({ doc, pinned, onTogglePinned }: TotalsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Totals</CardTitle>
        <Button variant="ghost" size="sm" onClick={onTogglePinned} className="text-muted-foreground">
          {pinned ? (
            <>
              <ArrowDownToLine className="h-4 w-4" aria-hidden />
              Move to bottom
            </>
          ) : (
            <>
              <ArrowUpToLine className="h-4 w-4" aria-hidden />
              Move to top
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <TotalsPanel
          subtotalCents={doc.subtotalCents}
          discountCents={doc.discountCents}
          taxCents={doc.taxCents}
          grandTotalCents={doc.grandTotalCents}
        />
      </CardContent>
    </Card>
  );
};
