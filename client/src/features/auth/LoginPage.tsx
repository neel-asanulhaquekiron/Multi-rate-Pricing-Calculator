import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { PasswordInput } from "@/features/auth/PasswordInput";
import { DemoCredentials } from "@/features/auth/DemoCredentials";

export const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? A login form would be noise — go to the app.
  if (user) {
    return <Navigate to="/documents" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // RequireAuth stashed where the user was headed before the redirect.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/documents", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "something went wrong — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Log in</CardTitle>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <ErrorAlert message={error} />
            <Field id="email" label="Email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field id="password" label="Password">
              <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
            </Field>
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
            <p className="text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/signup" className="underline underline-offset-4 hover:text-foreground">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <DemoCredentials />
    </div>
  );
};
