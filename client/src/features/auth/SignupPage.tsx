import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signupSchema } from "shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { PasswordInput } from "@/features/auth/PasswordInput";

interface FieldErrors {
  email?: string;
  password?: string;
}

export const SignupPage = () => {
  const { user, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/documents" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Instant feedback from the SAME schema the server enforces — the user
    // never round-trips to learn "password must be at least 8 characters".
    const parsed = signupSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          errors[field] = errors[field] ?? issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await signup(parsed.data.email, parsed.data.password);
      navigate("/documents", { replace: true });
    } catch (err) {
      // Server-side rejections the client can't predict, e.g. 409 EMAIL_TAKEN.
      setError(err instanceof ApiError ? err.message : "something went wrong — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-12 max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign up</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <ErrorAlert message={error} />
          <Field id="email" label="Email" error={fieldErrors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={fieldErrors.email !== undefined}
            />
          </Field>
          <Field id="password" label="Password" error={fieldErrors.password}>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              invalid={fieldErrors.password !== undefined}
            />
          </Field>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
