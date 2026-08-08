import { cn } from "@/lib/utils";
import type { DiscountKind } from "@/features/documents/DiscountInput";

interface DiscountKindToggleProps {
  kind: DiscountKind;
  onChange: (kind: DiscountKind) => void;
}

const OPTIONS: { kind: Exclude<DiscountKind, "none">; symbol: string; label: string }[] = [
  { kind: "percent", symbol: "%", label: "percent discount" },
  { kind: "fixed", symbol: "$", label: "fixed amount discount" },
];

/**
 * Capsule toggle for the discount type — lives on the field's label row.
 * Clicking the active segment again deselects it: neither pressed = no discount.
 */
export const DiscountKindToggle = ({ kind, onChange }: DiscountKindToggleProps) => {
  return (
    <div className="inline-flex h-5 items-center rounded-full border bg-muted p-0.5" role="group" aria-label="discount type">
      {OPTIONS.map((option) => (
        <button
          key={option.kind}
          type="button"
          aria-label={option.label}
          aria-pressed={kind === option.kind}
          onClick={() => onChange(kind === option.kind ? "none" : option.kind)}
          className={cn(
            "flex h-4 w-6 items-center justify-center rounded-full text-[11px] leading-none transition-colors",
            kind === option.kind
              ? "bg-background font-semibold text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.symbol}
        </button>
      ))}
    </div>
  );
};
