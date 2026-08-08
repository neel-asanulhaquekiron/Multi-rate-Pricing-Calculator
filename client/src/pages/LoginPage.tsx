import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";

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
    <div className="card auth-card">
      <h1>Log in</h1>
      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="muted">
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};
