import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
}

/** Single headline figure: muted label, big tabular number, optional quiet icon. */
export const StatCard = ({ label, value, icon: Icon }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-0">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tabular-nums" title={value}>
            {value}
          </p>
        </div>
        {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />}
      </CardContent>
    </Card>
  );
};
