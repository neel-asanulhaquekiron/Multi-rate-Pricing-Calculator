import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError } from "../api";
import { ErrorAlert } from "../components/ErrorAlert";
import { NewDocumentDialog } from "../components/NewDocumentDialog";
import { StatusBadge } from "../components/StatusBadge";
import type { DocumentDto } from "../types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; documents: DocumentDto[] };

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    api
      .get<{ documents: DocumentDto[] }>("/api/documents")
      .then(({ documents }) => {
        setState({ status: "ready", documents });
      })
      .catch((err) => {
        setState({ status: "error", message: err instanceof ApiError ? err.message : "failed to load documents" });
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <NewDocumentDialog />
      </div>

      {state.status === "loading" && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {state.status === "error" && <ErrorAlert message={state.message} />}

      {state.status === "ready" && state.documents.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground">Create your first document to start calculating totals.</p>
        </div>
      )}

      {state.status === "ready" && state.documents.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grand total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.documents.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{doc.customer}</TableCell>
                  <TableCell className="tabular-nums">{doc.issueDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${formatMoney(doc.grandTotalCents)}
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
