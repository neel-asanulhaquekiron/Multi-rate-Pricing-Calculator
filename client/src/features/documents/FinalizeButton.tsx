import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DocumentDto } from "@/lib/types";

interface FinalizeButtonProps {
  doc: DocumentDto;
  onChange: (doc: DocumentDto) => void;
  onError: (message: string) => void;
}

/**
 * The one-way door: draft -> finalized. Confirmed via dialog because there is
 * no way back — finalized documents reject every mutation including delete
 * (decision 13A); duplication into a new draft is the only continuation.
 */
export const FinalizeButton = ({ doc, onChange, onError }: FinalizeButtonProps) => {
  const onConfirm = async () => {
    try {
      const { document } = await api.post<{ document: DocumentDto }>(`/api/documents/${doc.id}/finalize`);
      onChange(document);
    } catch (err) {
      // e.g. 400 CANNOT_FINALIZE (invalid rows) or 409 from a stale tab.
      onError(err instanceof ApiError ? err.message : "failed to finalize document");
      throw err; // keep the dialog open
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button>
          <Lock className="h-4 w-4" aria-hidden />
          Finalize
        </Button>
      }
      title={`Finalize "${doc.title}"?`}
      description="Finalizing locks this document permanently — no more edits to lines, amounts, or details, and it cannot be deleted. You can still duplicate it into a new draft later."
      actionLabel="Finalize document"
      busyLabel="Finalizing…"
      actionVariant="default"
      onConfirm={onConfirm}
    />
  );
};
