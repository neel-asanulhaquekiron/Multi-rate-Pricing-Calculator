import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PercentInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Percent input (% suffix, decimal keypad). Raw string; parsed to basis
 * points at submit via shared parsePercent.
 */
export const PercentInput = ({ id, value, onChange, invalid, placeholder, className }: PercentInputProps) => {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        placeholder={placeholder ?? "0"}
        className={cn("pr-7", className)}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
        %
      </span>
    </div>
  );
};
