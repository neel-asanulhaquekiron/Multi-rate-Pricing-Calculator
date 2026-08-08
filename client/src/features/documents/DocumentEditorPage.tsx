import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { AddLineForm } from "@/features/documents/AddLineForm";
import { LineTable } from "@/features/documents/LineTable";
import { MetadataForm } from "@/features/documents/MetadataForm";
import { StatusBadge } from "@/features/documents/StatusBadge";
import { TotalsCard } from "@/features/documents/TotalsCard";
import type { DocumentDto } from "@/lib/types";

/**
 * The document editor. This page owns the document state; every child mutation
 * reports back the SERVER'S document response via setData — the client never
 * computes persisted state itself.
 */
export const DocumentEditorPage = () => {
  const { id } = useParams<{ id: string }>();

  // Totals position survives reloads — long-document users set it once.
  const [totalsPinned, setTotalsPinned] = useState(() => localStorage.getItem("totalsPinned") === "1");
  const toggleTotalsPinned = () => {
    setTotalsPinned((prev) => {
      localStorage.setItem("totalsPinned", prev ? "0" : "1");
      return !prev;
    });
  };

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

      {/* Flow: add-line first, then the table, totals last — with a toggle
          that moves totals up next to the form on long documents. */}
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

      {totalsPinned && <TotalsCard doc={doc} pinned onTogglePinned={toggleTotalsPinned} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineTable lines={doc.lines ?? []} />
        </CardContent>
      </Card>

      {!totalsPinned && <TotalsCard doc={doc} pinned={false} onTogglePinned={toggleTotalsPinned} />}
    </div>
  );
};
