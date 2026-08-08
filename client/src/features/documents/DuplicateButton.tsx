import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { todayYmd } from "@/lib/localDate";
import type { DocumentDto } from "@/lib/types";

interface DuplicateButtonProps {
  doc: DocumentDto;
  onError: (message: string) => void;
}

/**
 * Copies the document (any status — decision 13A) into a fresh draft dated
 * with the BROWSER'S local today (decision 10A) and navigates into it.
 * Non-destructive, so no confirmation dialog — the button carries its own
 * busy state instead.
 */
export const DuplicateButton = ({ doc, onError }: DuplicateButtonProps) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const { document } = await api.post<{ document: DocumentDto }>(`/api/documents/${doc.id}/duplicate`, {
        issueDate: todayYmd(),
      });
      navigate(`/documents/${document.id}`);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "failed to duplicate document");
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {busy ? "Duplicating…" : "Duplicate"}
    </Button>
  );
};
