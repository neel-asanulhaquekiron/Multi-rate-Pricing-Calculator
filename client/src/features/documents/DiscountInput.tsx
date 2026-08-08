import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { PercentInput } from "@/components/PercentInput";

export type DiscountKind = "none" | "percent" | "fixed";

interface DiscountInputProps {
  id: string;
  kind: DiscountKind;
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
}

/**
 * The discount VALUE input; its meaning follows the kind selected in the
 * label-row capsule (DiscountKindToggle). One value field bound to one kind —
 * sending both discount types at once is structurally impossible. Always
 * rendered (disabled when "none") so switching kinds never shifts the layout.
 */
export const DiscountInput = ({ id, kind, value, onValueChange, invalid }: DiscountInputProps) => {
  if (kind === "none") {
    return <Input disabled placeholder="no discount" aria-hidden />;
  }
  if (kind === "percent") {
    return <PercentInput id={id} value={value} onChange={onValueChange} invalid={invalid} placeholder="10" />;
  }
  return <MoneyInput id={id} value={value} onChange={onValueChange} invalid={invalid} placeholder="20.00" />;
};
