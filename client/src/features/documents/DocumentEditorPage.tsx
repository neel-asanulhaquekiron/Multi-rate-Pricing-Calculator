import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { AddLineForm } from "@/features/documents/AddLineForm";
import { LineTable } from "@/features/documents/LineTable";
import { MetadataForm } from "@/features/documents/MetadataForm";
import { StatusBadge } from "@/features/documents/StatusBadge";
import { TotalsPanel } from "@/features/documents/TotalsPanel";
import type { DocumentDto } from "@/lib/types";

/**
 * The document editor. This page owns the document state; every child mutation
 * reports back the SERVER'S document response via setData — the client never
 * computes persisted state itself.
 */
export const DocumentEditorPage = () => {
  const { id } = useParams<{ id: string }>();

  const { state, setData } = useLoad(
    () => api.get<{ document: DocumentDto }>(`/api/documents/${id}`).then((res) => res.document),
    [id],
  );

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <Link to="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to documents
        </Link>
        <ErrorAlert message={state.message} />
      </div>
    );
  }

  const doc = state.data;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link to="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to documents
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      <MetadataForm doc={doc} onChange={(updated) => setData(() => updated)} />

      {/* Table left; add-line + totals in a sticky sidebar so they stay
          visible however long the table grows. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line items</CardTitle>
          </CardHeader>
          <CardContent>
            <LineTable lines={doc.lines ?? []} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:sticky lg:top-6">
          {doc.status === "draft" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add line item</CardTitle>
              </CardHeader>
              <CardContent>
                <AddLineForm doc={doc} onChange={(updated) => setData(() => updated)} />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
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
        </div>
      </div>
    </div>
  );
};
