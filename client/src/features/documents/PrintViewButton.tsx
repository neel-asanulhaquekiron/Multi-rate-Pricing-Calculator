import { Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { DocumentDto } from "@/lib/types";

/** Opens the printable invoice view — any status. */
export const PrintViewButton = ({ doc }: { doc: DocumentDto }) => {
  const navigate = useNavigate();

  return (
    <Button variant="outline" onClick={() => navigate(`/documents/${doc.id}/print`)}>
      <Printer className="h-4 w-4" aria-hidden />
      Print view
    </Button>
  );
};
