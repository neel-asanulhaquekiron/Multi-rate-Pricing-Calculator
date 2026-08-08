import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DocumentEditorPage } from "@/features/documents/DocumentEditorPage";
import { docFixture } from "@/test/fixtures";
import { mockFetch } from "@/test/mockFetch";

const renderEditor = (docId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/documents/${docId}`]}>
      <Routes>
        <Route path="/documents/:id" element={<DocumentEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("DocumentEditorPage (finalized)", () => {
  it("renders fully read-only: no inputs, no add form, no line actions, no finalize", async () => {
    const doc = docFixture({ status: "finalized" });
    mockFetch([{ method: "GET", path: `/api/documents/${doc.id}`, status: 200, body: { document: doc } }]);

    renderEditor(doc.id);

    // Wait for load: the title renders as a heading.
    expect(await screen.findByRole("heading", { name: doc.title })).toBeInTheDocument();

    // Read-only contract: inputs are REMOVED, not disabled.
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByText("Add line item")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit .*/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete .*/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalize/i })).not.toBeInTheDocument();

    // The two allowed actions remain.
    expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print view/i })).toBeInTheDocument();
  });
});
