import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  /** Optional control rendered on the label row (e.g. the discount kind capsule). */
  labelExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Labeled form field with optional validation error. The label row has a
 * fixed height (h-5) so inputs across a form row stay aligned whether or not
 * a field carries a labelExtra control.
 */
export const Field = ({ id, label, error, labelExtra, children }: FieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelExtra}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
