import { useState, type FormEvent } from "react";
import { documentInputSchema } from "shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import type { DocumentDto } from "@/lib/types";

interface MetadataFormProps {
  doc: DocumentDto;
  onChange: (doc: DocumentDto) => void;
}

interface FieldErrors {
  title?: string;
  customer?: string;
  issueDate?: string;
}

/**
 * Title / customer / issue date. Editable with Save on drafts; plain
 * read-only rows on finalized documents (inputs removed, not just disabled).
 */
export const MetadataForm = ({ doc, onChange }: MetadataFormProps) => {
  const [title, setTitle] = useState(doc.title);
  const [customer, setCustomer] = useState(doc.customer);
  const [issueDate, setIssueDate] = useState(doc.issueDate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = title !== doc.title || customer !== doc.customer || issueDate !== doc.issueDate;

  if (doc.status === "finalized") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Title</p>
            <p className="font-medium">{doc.title}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{doc.customer}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Issue date</p>
            <p className="font-medium tabular-nums">{doc.issueDate}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

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

    setSaving(true);
    try {
      const { document } = await api.put<{ document: DocumentDto }>(`/api/documents/${doc.id}`, parsed.data);
      onChange(document);
    } catch (err) {
      // e.g. 409 DOCUMENT_FINALIZED from a stale tab — the server's message explains it.
      setError(err instanceof ApiError ? err.message : "failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="title" label="Title" error={fieldErrors.title}>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={fieldErrors.title !== undefined}
              />
            </Field>
            <Field id="customer" label="Customer" error={fieldErrors.customer}>
              <Input
                id="customer"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
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
          <Button type="submit" size="sm" disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
