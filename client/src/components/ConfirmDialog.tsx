import { Loader2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  /** The button that opens the dialog (passed to the trigger's render prop). */
  trigger: ReactElement;
  title: string;
  description: string;
  actionLabel: string;
  busyLabel: string;
  /** Visual weight of the confirm button; destructive red by default. */
  actionVariant?: "destructive" | "default";
  /** Resolve = close the dialog; throw = stay open (caller surfaces the error). */
  onConfirm: () => Promise<void>;
}

/**
 * Destructive confirmation with honest async feedback: while the action runs
 * the confirm button shows a spinner and BOTH buttons lock (no double-fire,
 * no escape-close); the dialog closes only after the action succeeds.
 */
export const ConfirmDialog = ({
  trigger,
  title,
  description,
  actionLabel,
  busyLabel,
  actionVariant = "destructive",
  onConfirm,
}: ConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onOpenChange = (next: boolean) => {
    if (!busy) {
      setOpen(next);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Caller already surfaced the error; keep the dialog open for retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            className={actionVariant === "destructive" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            onClick={confirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? busyLabel : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
