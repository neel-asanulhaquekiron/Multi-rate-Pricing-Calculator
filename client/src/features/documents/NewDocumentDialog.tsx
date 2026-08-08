import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { documentInputSchema } from "shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { todayYmd } from "@/lib/localDate";
import type { DocumentDto } from "@/lib/types";

interface FieldErrors {
  title?: string;
  customer?: string;
  issueDate?: string;
}

/** "New document" button + creation dialog; navigates into the fresh draft. */
export const NewDocumentDialog = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState(todayYmd());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Fresh form every time the dialog opens.
      setTitle("");
      setCustomer("");
      setIssueDate(todayYmd());
      setFieldErrors({});
      setError(null);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Same schema the server enforces — instant field feedback.
    const parsed = documentInputSchema.safeParse({ title, customer, issueDate });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "title" || field === "customer" || field === "issueDate") {
          errors[field] = errors[field] ?? issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const { document } = await api.post<{ document: DocumentDto }>("/api/documents", parsed.data);
      setOpen(false);
      navigate(`/documents/${document.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "something went wrong — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            New document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>Starts as an editable draft — add line items next.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <div className="space-y-4">
            <ErrorAlert message={error} />
            <Field id="title" label="Title" error={fieldErrors.title}>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Q3 quote"
                aria-invalid={fieldErrors.title !== undefined}
              />
            </Field>
            <Field id="customer" label="Customer" error={fieldErrors.customer}>
              <Input
                id="customer"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Acme Corp"
                aria-invalid={fieldErrors.customer !== undefined}
              />
            </Field>
            <Field id="issueDate" label="Issue date" error={fieldErrors.issueDate}>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                aria-invalid={fieldErrors.issueDate !== undefined}
              />
            </Field>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
