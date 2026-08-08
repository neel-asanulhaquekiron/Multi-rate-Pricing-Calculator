import { FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { DeleteDraftButton } from "@/features/documents/DeleteDraftButton";
import { NewDocumentDialog } from "@/features/documents/NewDocumentDialog";
import { StatusBadge } from "@/features/documents/StatusBadge";
import type { DocumentDto } from "@/lib/types";

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);

  const { state, setData } = useLoad(
    () => api.get<{ documents: DocumentDto[] }>("/api/documents").then((res) => res.documents),
    [],
  );

  const onDeleted = (id: string) => {
    setActionError(null);
    setData((documents) => documents.filter((doc) => doc.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <NewDocumentDialog />
      </div>

      <ErrorAlert message={actionError} />

      {state.status === "loading" && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {state.status === "error" && <ErrorAlert message={state.message} />}

      {state.status === "ready" && state.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground">Create your first document to start calculating totals.</p>
        </div>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grand total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.data.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{doc.customer}</TableCell>
                  <TableCell className="tabular-nums">{doc.issueDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${formatMoney(doc.grandTotalCents)}
                  </TableCell>
                  <TableCell>
                    {doc.status === "draft" && (
                      <DeleteDraftButton doc={doc} onDeleted={onDeleted} onError={setActionError} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
