import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "../types";

/** Draft = amber outline, finalized = green — used by list, editor, and print view. */
export const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "draft"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-emerald-300 bg-emerald-50 text-emerald-700",
      )}
    >
      {status}
    </Badge>
  );
};
