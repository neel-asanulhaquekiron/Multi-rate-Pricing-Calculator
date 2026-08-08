import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Dollar amount input ($ prefix, decimal keypad). Holds the raw string —
 * parsing to cents happens once at submit via shared parseMoney, so a user
 * mid-keystroke ("10.") is never fought by the field.
 */
export const MoneyInput = ({ id, value, onChange, invalid, placeholder, className }: MoneyInputProps) => {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        placeholder={placeholder ?? "0.00"}
        className={cn("pl-7", className)}
      />
    </div>
  );
};
