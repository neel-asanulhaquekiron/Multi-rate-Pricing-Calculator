import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth/AuthContext";
import { mockFetch } from "@/test/mockFetch";

describe("session expiry", () => {
  it("a 401 from any API call mid-session lands the user on the login page", async () => {
    // Login state is valid on mount, but the documents fetch comes back 401
    // (expired cookie) — the auth context must clear and RequireAuth redirect.
    mockFetch([
      { method: "GET", path: "/api/auth/me", status: 200, body: { user: { id: "u1", email: "neel@example.com" } } },
      { method: "GET", path: "/api/documents", status: 401, body: { code: "UNAUTHORIZED", message: "authentication required" } },
    ]);

    render(
      <MemoryRouter initialEntries={["/documents"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );

    // The login page's submit button (the nav's "Log in" is a link, not a button).
    expect(await screen.findByRole("button", { name: "Log in" })).toBeInTheDocument();
  });
});
