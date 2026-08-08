import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DocumentDto, LineDto } from "@/lib/types";

interface DeleteLineButtonProps {
  doc: DocumentDto;
  line: LineDto;
  onChange: (doc: DocumentDto) => void;
  onError: (message: string) => void;
}

/** Trash + confirm for a line item; totals refresh from the server's response. */
export const DeleteLineButton = ({ doc, line, onChange, onError }: DeleteLineButtonProps) => {
  const onConfirm = async () => {
    try {
      const { document } = await api.delete<{ document: DocumentDto }>(`/api/documents/${doc.id}/lines/${line.id}`);
      onChange(document);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "failed to delete line");
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
          aria-label={`delete ${line.description}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      }
      title={`Delete "${line.description}"?`}
      description="The document totals will be recomputed without this line."
      actionLabel="Delete line"
      busyLabel="Deleting…"
      onConfirm={onConfirm}
    />
  );
};
