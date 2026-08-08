import { Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { MoneyInput } from "@/components/MoneyInput";
import { PercentInput } from "@/components/PercentInput";
import { DiscountInput } from "@/features/documents/DiscountInput";
import { DiscountKindToggle } from "@/features/documents/DiscountKindToggle";
import { LinePreview } from "@/features/documents/LinePreview";
import { useLineForm } from "@/features/documents/useLineForm";
import type { DocumentDto, LineDto } from "@/lib/types";

interface EditLineDialogProps {
  doc: DocumentDto;
  line: LineDto;
  onChange: (doc: DocumentDto) => void;
}

/** Pencil button + dialog to edit an existing line; same form brain as AddLineForm. */
export const EditLineDialog = ({ doc, line, onChange }: EditLineDialogProps) => {
  const form = useLineForm(line);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      form.reset(line);
      setError(null);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = form.validate();
    if (!payload) {
      return;
    }

    setSaving(true);
    try {
      const { document } = await api.put<{ document: DocumentDto }>(
        `/api/documents/${doc.id}/lines/${line.id}`,
        payload,
      );
      onChange(document);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "failed to save line");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`edit ${line.description}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit line item</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <ErrorAlert message={error} />
          <Field id="edit-description" label="Description" error={form.fieldErrors.description}>
            <Input
              id="edit-description"
              value={form.values.description}
              onChange={(event) => form.set("description", event.target.value)}
              aria-invalid={form.fieldErrors.description !== undefined}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="edit-quantity" label="Qty" error={form.fieldErrors.quantity}>
              <Input
                id="edit-quantity"
                type="number"
                min={1}
                step={1}
                value={form.values.quantity}
                onChange={(event) => form.set("quantity", event.target.value)}
                aria-invalid={form.fieldErrors.quantity !== undefined}
              />
            </Field>
            <Field id="edit-unit-price" label="Unit price" error={form.fieldErrors.unitPrice}>
              <MoneyInput
                id="edit-unit-price"
                value={form.values.unitPrice}
                onChange={(value) => form.set("unitPrice", value)}
                invalid={form.fieldErrors.unitPrice !== undefined}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="edit-discount"
              label="Discount"
              error={form.fieldErrors.discount}
              labelExtra={<DiscountKindToggle kind={form.values.discountKind} onChange={form.setDiscountKind} />}
            >
              <DiscountInput
                id="edit-discount"
                kind={form.values.discountKind}
                value={form.values.discountValue}
                onValueChange={(value) => form.set("discountValue", value)}
                invalid={form.fieldErrors.discount !== undefined}
              />
            </Field>
            <Field id="edit-tax" label="Tax %" error={form.fieldErrors.tax}>
              <PercentInput
                id="edit-tax"
                value={form.values.tax}
                onChange={(value) => form.set("tax", value)}
                invalid={form.fieldErrors.tax !== undefined}
              />
            </Field>
          </div>
          <LinePreview totals={form.previewTotals} docGrandTotalCents={doc.grandTotalCents - line.totalCents} />
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
