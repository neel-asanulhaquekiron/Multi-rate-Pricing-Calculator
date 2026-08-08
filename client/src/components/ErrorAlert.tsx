import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Server-error banner; renders nothing when there is no message. */
export const ErrorAlert = ({ message }: { message: string | null }) => {
  if (!message) {
    return null;
  }
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
