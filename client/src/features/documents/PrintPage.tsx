import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LineTable } from "@/features/documents/LineTable";
import { StatusBadge } from "@/features/documents/StatusBadge";
import { TotalsPanel } from "@/features/documents/TotalsPanel";
import type { DocumentDto } from "@/lib/types";

/**
 * Invoice-style rendering of a document, built for paper: no cards, no
 * controls — the LineTable rides in read-only mode (no onChange).
 * Print button and editor link arrive in 6.6.2/6.6.3.
 */
export const PrintPage = () => {
  const { id } = useParams<{ id: string }>();

  const { state } = useLoad(
    () => api.get<{ document: DocumentDto }>(`/api/documents/${id}`).then((res) => res.document),
    [id],
  );

  if (state.status === "loading") {
    return <Skeleton className="h-64 w-full" />;
  }
  if (state.status === "error") {
    return <ErrorAlert message={state.message} />;
  }

  const doc = state.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/documents/${doc.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to document
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Print / Save as PDF
        </Button>
      </div>

      <header className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <StatusBadge status={doc.status} />
        </div>
        <div className="flex gap-12 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{doc.customer}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Issue date</p>
            <p className="font-medium tabular-nums">{doc.issueDate}</p>
          </div>
        </div>
      </header>

      <Separator />

      <LineTable doc={doc} />

      <Separator />

      <TotalsPanel
        subtotalCents={doc.subtotalCents}
        discountCents={doc.discountCents}
        taxCents={doc.taxCents}
        grandTotalCents={doc.grandTotalCents}
      />
    </div>
  );
};
