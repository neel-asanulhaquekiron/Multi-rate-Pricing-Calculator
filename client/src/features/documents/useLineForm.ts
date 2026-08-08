import { useMemo, useState } from "react";
import {
  calcLine,
  formatMoney,
  formatPercent,
  lineInputSchema,
  parseMoney,
  parsePercent,
  type Discount,
  type LineItemInput,
} from "shared";
import type { DiscountKind } from "@/features/documents/DiscountInput";
import type { LineDto } from "@/lib/types";

export interface LineFieldErrors {
  description?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  tax?: string;
}

interface LineFormValues {
  description: string;
  quantity: string;
  unitPrice: string;
  discountKind: DiscountKind;
  discountValue: string;
  tax: string;
}

const EMPTY: LineFormValues = { description: "", quantity: "1", unitPrice: "", discountKind: "none", discountValue: "", tax: "" };

/** Server cents/bp -> the form's string representation. */
const fromLine = (line: LineDto): LineFormValues => {
  return {
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: formatMoney(line.unitPriceCents),
    discountKind: line.discount?.type ?? "none",
    discountValue:
      line.discount === null ? "" : line.discount.type === "percent" ? formatPercent(line.discount.bp) : formatMoney(line.discount.cents),
    tax: line.taxBp === null ? "" : formatPercent(line.taxBp),
  };
};

/**
 * One line-item form brain, shared by AddLineForm and EditLineDialog:
 * raw-string field state, shared-schema validation with per-field messages,
 * payload building, and the live calcLine preview.
 */
export const useLineForm = (initial?: LineDto) => {
  const [values, setValues] = useState<LineFormValues>(initial ? fromLine(initial) : EMPTY);
  const [fieldErrors, setFieldErrors] = useState<LineFieldErrors>({});

  const set = <K extends keyof LineFormValues>(key: K, value: LineFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setDiscountKind = (kind: DiscountKind) => {
    // A percent value makes no sense as dollars (and vice versa) — reset.
    setValues((prev) => ({ ...prev, discountKind: kind, discountValue: "" }));
  };

  const previewTotals = useMemo(() => {
    if (values.unitPrice.trim() === "") {
      return null;
    }
    try {
      let discount: Discount = null;
      if (values.discountKind === "percent") {
        discount = { type: "percent", bp: parsePercent(values.discountValue || "0") };
      }
      if (values.discountKind === "fixed") {
        discount = { type: "fixed", cents: parseMoney(values.discountValue || "0") };
      }
      return calcLine({
        quantity: Number(values.quantity),
        unitPriceCents: parseMoney(values.unitPrice),
        discount,
        taxBp: values.tax.trim() === "" ? null : parsePercent(values.tax),
      });
    } catch {
      return null;
    }
  }, [values]);

  /** Parse + validate; returns the API payload or null (with fieldErrors set). */
  const validate = (): LineItemInput | null => {
    const errors: LineFieldErrors = {};
    let unitPriceCents = 0;
    let taxBp: number | null = null;
    let discount: Discount = null;

    try {
      unitPriceCents = parseMoney(values.unitPrice || "0");
    } catch (err) {
      errors.unitPrice = err instanceof RangeError ? err.message : "invalid amount";
    }
    try {
      taxBp = values.tax.trim() === "" ? null : parsePercent(values.tax);
    } catch (err) {
      errors.tax = err instanceof RangeError ? err.message : "invalid percent";
    }
    try {
      if (values.discountKind === "percent") {
        discount = { type: "percent", bp: parsePercent(values.discountValue || "0") };
      }
      if (values.discountKind === "fixed") {
        discount = { type: "fixed", cents: parseMoney(values.discountValue || "0") };
      }
    } catch (err) {
      errors.discount = err instanceof RangeError ? err.message : "invalid discount";
    }

    const parsed = lineInputSchema.safeParse({
      description: values.description,
      quantity: Number(values.quantity),
      unitPriceCents,
      discount,
      taxBp,
    });
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
          errors.discount = errors.discount ?? issue.message;
        }
        if (field === "taxBp") {
          errors.tax = errors.tax ?? issue.message;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return null;
    }
    setFieldErrors({});
    return parsed.success ? parsed.data : null;
  };

  const reset = (line?: LineDto) => {
    setValues(line ? fromLine(line) : EMPTY);
    setFieldErrors({});
  };

  return { values, set, setDiscountKind, fieldErrors, previewTotals, validate, reset };
};
