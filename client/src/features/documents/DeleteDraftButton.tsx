import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DocumentDto } from "@/lib/types";

interface DeleteDraftButtonProps {
  doc: DocumentDto;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}

/** Trash + confirm for DRAFT rows; finalized documents are undeletable (13A). */
export const DeleteDraftButton = ({ doc, onDeleted, onError }: DeleteDraftButtonProps) => {
  const onConfirm = async () => {
    try {
      await api.delete(`/api/documents/${doc.id}`);
      onDeleted(doc.id);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "failed to delete document");
      throw err; // keep the dialog open
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`delete ${doc.title}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      }
      title={`Delete "${doc.title}"?`}
      description="This permanently removes the draft and its line items. This cannot be undone."
      actionLabel="Delete draft"
      busyLabel="Deleting…"
      onConfirm={onConfirm}
    />
  );
};
