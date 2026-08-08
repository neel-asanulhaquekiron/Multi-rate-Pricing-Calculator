import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { lineInputSchema, parseMoney, parsePercent, type Discount } from "shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { MoneyInput } from "@/components/MoneyInput";
import { PercentInput } from "@/components/PercentInput";
import { DiscountInput, type DiscountKind } from "@/features/documents/DiscountInput";
import { DiscountKindToggle } from "@/features/documents/DiscountKindToggle";
import type { DocumentDto } from "@/lib/types";

interface AddLineFormProps {
  doc: DocumentDto;
  onChange: (doc: DocumentDto) => void;
}

interface FieldErrors {
  description?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  tax?: string;
}

/**
 * Inputs hold raw strings; shared parseMoney/parsePercent convert once at
 * submit, and the shared lineInputSchema validates the final payload — the
 * exact pipeline the server runs.
 */
export const AddLineForm = ({ doc, onChange }: AddLineFormProps) => {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [discountKind, setDiscountKind] = useState<DiscountKind>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [tax, setTax] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDescription("");
    setQuantity("1");
    setUnitPrice("");
    setDiscountKind("none");
    setDiscountValue("");
    setTax("");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const errors: FieldErrors = {};
    let unitPriceCents = 0;
    let taxBp: number | null = null;
    let discount: Discount = null;

    try {
      unitPriceCents = parseMoney(unitPrice || "0");
    } catch (err) {
      errors.unitPrice = err instanceof RangeError ? err.message : "invalid amount";
    }
    try {
      taxBp = tax.trim() === "" ? null : parsePercent(tax);
    } catch (err) {
      errors.tax = err instanceof RangeError ? err.message : "invalid percent";
    }
    try {
      if (discountKind === "percent") {
        discount = { type: "percent", bp: parsePercent(discountValue || "0") };
      }
      if (discountKind === "fixed") {
        discount = { type: "fixed", cents: parseMoney(discountValue || "0") };
      }
    } catch (err) {
      errors.discount = err instanceof RangeError ? err.message : "invalid discount";
    }

    const payload = {
      description,
      quantity: Number(quantity),
      unitPriceCents,
      discount,
      taxBp,
    };
    const parsed = lineInputSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "description") {
          errors.description = errors.description ?? issue.message;
        }
        if (field === "quantity") {
          errors.quantity = errors.quantity ?? issue.message;
        }
        if (field === "unitPriceCents") {
          errors.unitPrice = errors.unitPrice ?? issue.message;
        }
        if (field === "discount") {
          // Includes decision 1A: "fixed discount cannot exceed the line subtotal".
          errors.discount = errors.discount ?? issue.message;
        }
        if (field === "taxBp") {
          errors.tax = errors.tax ?? issue.message;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const { document } = await api.post<{ document: DocumentDto }>(`/api/documents/${doc.id}/lines`, parsed.data);
      onChange(document);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "failed to add line");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <ErrorAlert message={error} />
      <div className="space-y-4">
        <Field id="line-description" label="Description" error={fieldErrors.description}>
          <Input
            id="line-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Widget A"
            aria-invalid={fieldErrors.description !== undefined}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="line-quantity" label="Qty" error={fieldErrors.quantity}>
            <Input
              id="line-quantity"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              aria-invalid={fieldErrors.quantity !== undefined}
            />
          </Field>
          <Field id="line-unit-price" label="Unit price" error={fieldErrors.unitPrice}>
            <MoneyInput
              id="line-unit-price"
              value={unitPrice}
              onChange={setUnitPrice}
              invalid={fieldErrors.unitPrice !== undefined}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="line-discount"
            label="Discount"
            error={fieldErrors.discount}
            labelExtra={
              <DiscountKindToggle
                kind={discountKind}
                onChange={(kind) => {
                  setDiscountKind(kind);
                  // A percent value makes no sense as dollars (and vice versa).
                  setDiscountValue("");
                }}
              />
            }
          >
            <DiscountInput
              id="line-discount"
              kind={discountKind}
              value={discountValue}
              onValueChange={setDiscountValue}
              invalid={fieldErrors.discount !== undefined}
            />
          </Field>
          <Field id="line-tax" label="Tax %" error={fieldErrors.tax}>
            <PercentInput id="line-tax" value={tax} onChange={setTax} invalid={fieldErrors.tax !== undefined} />
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          <Plus className="h-4 w-4" aria-hidden />
          {submitting ? "Adding…" : "Add line"}
        </Button>
      </div>
    </form>
  );
};
