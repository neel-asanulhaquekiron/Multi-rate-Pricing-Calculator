import { Input } from "@/components/ui/input";

interface PercentInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
}

/**
 * Percent input (% suffix, decimal keypad). Raw string; parsed to basis
 * points at submit via shared parsePercent.
 */
export const PercentInput = ({ id, value, onChange, invalid, placeholder }: PercentInputProps) => {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        placeholder={placeholder ?? "0"}
        className="pr-7"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
        %
      </span>
    </div>
  );
};
