import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddLineForm } from "@/features/documents/AddLineForm";
import { docFixture } from "@/test/fixtures";
import { mockFetch, type RecordedCall } from "@/test/mockFetch";

const doc = docFixture();

const fillBasics = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Description"), "Widget A");
  await user.type(screen.getByLabelText("Unit price"), "100.00");
};

const lastPost = (calls: RecordedCall[]): RecordedCall => {
  const posts = calls.filter((call) => call.method === "POST");
  expect(posts.length).toBeGreaterThan(0);
  return posts[posts.length - 1];
};

describe("AddLineForm", () => {
  it("never sends percent AND fixed — the payload follows the selected kind only", async () => {
    const user = userEvent.setup();
    const { calls } = mockFetch([
      { method: "POST", path: `/api/documents/${doc.id}/lines`, status: 201, body: { document: doc } },
    ]);
    render(<AddLineForm doc={doc} onChange={() => {}} />);

    await fillBasics(user);

    // Percent selected, value typed…
    await user.click(screen.getByRole("button", { name: "percent discount" }));
    await user.type(screen.getByLabelText("Discount"), "10");
    // …then the user changes their mind to fixed.
    await user.click(screen.getByRole("button", { name: "fixed amount discount" }));
    await user.type(screen.getByLabelText("Discount"), "20.00");

    await user.click(screen.getByRole("button", { name: "add line" }));

    await waitFor(() => {
      const payload = lastPost(calls).body as { discount: Record<string, unknown> };
      expect(payload.discount).toEqual({ type: "fixed", cents: 2000 });
      expect(payload.discount).not.toHaveProperty("bp");
    });
  });

  it("sends percent as basis points, without a cents key", async () => {
    const user = userEvent.setup();
    const { calls } = mockFetch([
      { method: "POST", path: `/api/documents/${doc.id}/lines`, status: 201, body: { document: doc } },
    ]);
    render(<AddLineForm doc={doc} onChange={() => {}} />);

    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: "percent discount" }));
    await user.type(screen.getByLabelText("Discount"), "7.25");
    await user.click(screen.getByRole("button", { name: "add line" }));

    await waitFor(() => {
      const payload = lastPost(calls).body as { discount: Record<string, unknown> };
      expect(payload.discount).toEqual({ type: "percent", bp: 725 });
      expect(payload.discount).not.toHaveProperty("cents");
    });
  });

  it("round-trips the money input through the shared parser (100.5 -> 10050 cents)", async () => {
    const user = userEvent.setup();
    const { calls } = mockFetch([
      { method: "POST", path: `/api/documents/${doc.id}/lines`, status: 201, body: { document: doc } },
    ]);
    render(<AddLineForm doc={doc} onChange={() => {}} />);

    await user.type(screen.getByLabelText("Description"), "Widget B");
    await user.type(screen.getByLabelText("Unit price"), "100.5");
    await user.click(screen.getByRole("button", { name: "add line" }));

    await waitFor(() => {
      expect((lastPost(calls).body as { unitPriceCents: number }).unitPriceCents).toBe(10050);
    });
  });

  it("renders the server's 409 message in the error banner", async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        method: "POST",
        path: `/api/documents/${doc.id}/lines`,
        status: 409,
        body: { code: "DOCUMENT_FINALIZED", message: "finalized documents cannot be modified" },
      },
    ]);
    render(<AddLineForm doc={doc} onChange={() => {}} />);

    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: "add line" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("finalized documents cannot be modified");
  });
});
