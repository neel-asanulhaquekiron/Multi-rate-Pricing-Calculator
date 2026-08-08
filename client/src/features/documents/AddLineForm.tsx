import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
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
import type { DocumentDto } from "@/lib/types";

interface AddLineFormProps {
  doc: DocumentDto;
  onChange: (doc: DocumentDto) => void;
}

/** Single-row add form; all field logic lives in useLineForm (shared with EditLineDialog). */
export const AddLineForm = ({ doc, onChange }: AddLineFormProps) => {
  const form = useLineForm();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = form.validate();
    if (!payload) {
      return;
    }

    setSubmitting(true);
    try {
      const { document } = await api.post<{ document: DocumentDto }>(`/api/documents/${doc.id}/lines`, payload);
      onChange(document);
      form.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "failed to add line");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <ErrorAlert message={error} />
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-40 flex-1">
          <Field id="line-description" label="Description" error={form.fieldErrors.description}>
            <Input
              id="line-description"
              value={form.values.description}
              onChange={(event) => form.set("description", event.target.value)}
              placeholder="Widget A"
              aria-invalid={form.fieldErrors.description !== undefined}
            />
          </Field>
        </div>
        <div className="w-20 shrink-0">
          <Field id="line-quantity" label="Qty" error={form.fieldErrors.quantity}>
            <Input
              id="line-quantity"
              type="number"
              min={1}
              step={1}
              value={form.values.quantity}
              onChange={(event) => form.set("quantity", event.target.value)}
              aria-invalid={form.fieldErrors.quantity !== undefined}
            />
          </Field>
        </div>
        <div className="w-32 shrink-0">
          <Field id="line-unit-price" label="Unit price" error={form.fieldErrors.unitPrice}>
            <MoneyInput
              id="line-unit-price"
              value={form.values.unitPrice}
              onChange={(value) => form.set("unitPrice", value)}
              invalid={form.fieldErrors.unitPrice !== undefined}
            />
          </Field>
        </div>
        <div className="w-44 shrink-0">
          <Field
            id="line-discount"
            label="Discount"
            error={form.fieldErrors.discount}
            labelExtra={<DiscountKindToggle kind={form.values.discountKind} onChange={form.setDiscountKind} />}
          >
            <DiscountInput
              id="line-discount"
              kind={form.values.discountKind}
              value={form.values.discountValue}
              onValueChange={(value) => form.set("discountValue", value)}
              invalid={form.fieldErrors.discount !== undefined}
            />
          </Field>
        </div>
        <div className="w-24 shrink-0">
          <Field id="line-tax" label="Tax %" error={form.fieldErrors.tax}>
            <PercentInput
              id="line-tax"
              value={form.values.tax}
              onChange={(value) => form.set("tax", value)}
              invalid={form.fieldErrors.tax !== undefined}
            />
          </Field>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {/* Invisible twin of the Field label row — keeps the button flush with the inputs. */}
          <span className="invisible h-5 text-sm leading-none font-medium select-none" aria-hidden>
            Add
          </span>
          <Button type="submit" disabled={submitting} aria-label="add line">
            <Plus className="h-4 w-4" aria-hidden />
            {submitting ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
      <LinePreview totals={form.previewTotals} docGrandTotalCents={doc.grandTotalCents} />
    </form>
  );
};
