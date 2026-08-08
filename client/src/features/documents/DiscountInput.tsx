import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/MoneyInput";
import { PercentInput } from "@/components/PercentInput";

export type DiscountKind = "none" | "percent" | "fixed";

interface DiscountInputProps {
  id: string;
  kind: DiscountKind;
  value: string;
  onKindChange: (kind: DiscountKind) => void;
  onValueChange: (value: string) => void;
  invalid?: boolean;
}

/**
 * The percent-XOR-fixed selector: ONE kind dropdown + ONE value input bound to
 * it. Sending both discount types at once is structurally impossible — there
 * is only one value field, and its meaning follows the selected kind.
 */
export const DiscountInput = ({ id, kind, value, onKindChange, onValueChange, invalid }: DiscountInputProps) => {
  const onKind = (next: DiscountKind) => {
    onKindChange(next);
    // A percent value makes no sense as dollars (and vice versa) — reset.
    onValueChange("");
  };

  return (
    <div className="flex gap-2">
      <Select value={kind} onValueChange={(next) => onKind(next as DiscountKind)}>
        <SelectTrigger aria-label="discount type" className="w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="percent">Percent</SelectItem>
          <SelectItem value="fixed">Fixed $</SelectItem>
        </SelectContent>
      </Select>
      {kind === "percent" && (
        <PercentInput id={id} value={value} onChange={onValueChange} invalid={invalid} placeholder="10" />
      )}
      {kind === "fixed" && (
        <MoneyInput id={id} value={value} onChange={onValueChange} invalid={invalid} placeholder="20.00" />
      )}
    </div>
  );
};
