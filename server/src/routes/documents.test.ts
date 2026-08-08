import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { prisma } from "../db";

const runId = `test-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "correct-horse-9";

/** The spec's sample lines, as API payloads. */
const sampleLines = [
  { description: "Widget A", quantity: 2, unitPriceCents: 10000, discount: { type: "percent", bp: 1000 }, taxBp: 500 },
  { description: "Widget B", quantity: 1, unitPriceCents: 5000, discount: null, taxBp: 500 },
  { description: "Service fee", quantity: 1, unitPriceCents: 20000, discount: { type: "fixed", cents: 2000 }, taxBp: null },
];

let cookieA = "";
let cookieB = "";

const signup = async (label: string): Promise<string> => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email: `${runId}-${label}@example.com`, password: PASSWORD });
  expect(res.status).toBe(201);
  return ([] as string[]).concat(res.headers["set-cookie"])[0].split(";")[0];
};

const createDoc = async (cookie: string, title = "Quote"): Promise<string> => {
  const res = await request(app)
    .post("/api/documents")
    .set("Cookie", cookie)
    .send({ title, customer: "Acme Corp", issueDate: "2026-08-08" });
  expect(res.status).toBe(201);
  return res.body.document.id;
};

const addLine = async (cookie: string, docId: string, line: unknown): Promise<request.Response> => {
  return request(app).post(`/api/documents/${docId}/lines`).set("Cookie", cookie).send(line as object);
};

const buildSampleDoc = async (cookie: string): Promise<string> => {
  const docId = await createDoc(cookie, "Sample");
  for (const line of sampleLines) {
    const res = await addLine(cookie, docId, line);
    expect(res.status).toBe(201);
  }
  return docId;
};

beforeAll(async () => {
  cookieA = await signup("usera");
  cookieB = await signup("userb");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await prisma.$disconnect();
});

describe("document CRUD", () => {
  it("creates a draft with zero totals", async () => {
    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookieA)
      .send({ title: "Q1 quote", customer: "Acme Corp", issueDate: "2026-08-08" });
    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({
      title: "Q1 quote",
      customer: "Acme Corp",
      issueDate: "2026-08-08",
      status: "draft",
      subtotalCents: 0,
      grandTotalCents: 0,
      lines: [],
    });
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/documents");
    expect(res.status).toBe(401);
  });

  it("rejects a missing title with a specific message", async () => {
    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookieA)
      .send({ customer: "Acme", issueDate: "2026-08-08" });
    expect(res.status).toBe(400);
    expect(res.body.details).toContainEqual({ field: "title", message: "title is required" });
  });

  it("rejects an impossible issue date", async () => {
    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookieA)
      .send({ title: "T", customer: "C", issueDate: "2026-02-30" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("issue date must be a real date in YYYY-MM-DD format");
  });

  it("updates draft metadata", async () => {
    const docId = await createDoc(cookieA);
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set("Cookie", cookieA)
      .send({ title: "Renamed", customer: "New Corp", issueDate: "2026-07-01" });
    expect(res.status).toBe(200);
    expect(res.body.document).toMatchObject({ title: "Renamed", customer: "New Corp", issueDate: "2026-07-01" });
  });

  it("deletes a draft", async () => {
    const docId = await createDoc(cookieA);
    const del = await request(app).delete(`/api/documents/${docId}`).set("Cookie", cookieA);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/documents/${docId}`).set("Cookie", cookieA);
    expect(get.status).toBe(404);
  });

  it("404s on an unknown id and on a malformed id (no 500s)", async () => {
    const unknown = await request(app)
      .get("/api/documents/00000000-0000-4000-8000-000000000000")
      .set("Cookie", cookieA);
    expect(unknown.status).toBe(404);
    const malformed = await request(app).get("/api/documents/not-a-uuid").set("Cookie", cookieA);
    expect(malformed.status).toBe(404);
  });
});

describe("calculations through the API (spec sample)", () => {
  it("builds the sample document and matches the PDF totals exactly", async () => {
    const docId = await buildSampleDoc(cookieA);
    const res = await request(app).get(`/api/documents/${docId}`).set("Cookie", cookieA);
    expect(res.status).toBe(200);
    expect(res.body.document).toMatchObject({
      subtotalCents: 45000,
      discountCents: 4000,
      taxCents: 1150,
      grandTotalCents: 42150,
    });
    const lines = res.body.document.lines;
    expect(lines.map((l: { description: string }) => l.description)).toEqual(["Widget A", "Widget B", "Service fee"]);
    expect(lines[0]).toMatchObject({ subtotalCents: 20000, discountCents: 2000, taxCents: 900, totalCents: 18900 });
    expect(lines[1]).toMatchObject({ subtotalCents: 5000, discountCents: 0, taxCents: 250, totalCents: 5250 });
    expect(lines[2]).toMatchObject({ subtotalCents: 20000, discountCents: 2000, taxCents: 0, totalCents: 18000 });
  });

  it("recomputes totals when a line is updated", async () => {
    const docId = await createDoc(cookieA);
    const added = await addLine(cookieA, docId, sampleLines[0]);
    const lineId = added.body.document.lines[0].id;

    const res = await request(app)
      .put(`/api/documents/${docId}/lines/${lineId}`)
      .set("Cookie", cookieA)
      .send({ description: "Widget A", quantity: 4, unitPriceCents: 10000, discount: { type: "percent", bp: 1000 }, taxBp: 500 });
    expect(res.status).toBe(200);
    // 4 x 100 = 400, -10% = 360, +5% = 378
    expect(res.body.document).toMatchObject({ subtotalCents: 40000, grandTotalCents: 37800 });
  });

  it("recomputes totals when a line is deleted", async () => {
    const docId = await buildSampleDoc(cookieA);
    const doc = await request(app).get(`/api/documents/${docId}`).set("Cookie", cookieA);
    const widgetA = doc.body.document.lines[0];

    const res = await request(app).delete(`/api/documents/${docId}/lines/${widgetA.id}`).set("Cookie", cookieA);
    expect(res.status).toBe(200);
    // Without Widget A: 50 + 200 subtotal, 52.50 + 180 totals
    expect(res.body.document).toMatchObject({ subtotalCents: 25000, grandTotalCents: 23250 });
  });
});

describe("line validation", () => {
  let docId = "";
  beforeAll(async () => {
    docId = await createDoc(cookieA, "Validation target");
  });

  it.each([
    ["quantity 0", { description: "X", quantity: 0, unitPriceCents: 100 }, "quantity must be an integer ≥ 1"],
    ["negative price", { description: "X", quantity: 1, unitPriceCents: -5 }, "unit price must be ≥ 0"],
    ["fractional cents", { description: "X", quantity: 1, unitPriceCents: 10.5 }, "unit price must be a whole number of cents"],
    ["percent above 100", { description: "X", quantity: 1, unitPriceCents: 100, discount: { type: "percent", bp: 10001 } }, "percent must be between 0 and 100 with at most 2 decimal places"],
    ["missing description", { quantity: 1, unitPriceCents: 100 }, "description is required"],
  ])("rejects %s with its specific message", async (_name, line, message) => {
    const res = await addLine(cookieA, docId, line);
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { message: string }) => d.message)).toContain(message);
  });

  it("rejects percent AND fixed on one line — decision 14A", async () => {
    const res = await addLine(cookieA, docId, {
      description: "X",
      quantity: 1,
      unitPriceCents: 1000,
      discount: { type: "percent", bp: 500, cents: 100 },
    });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { message: string }) => d.message)).toContain(
      "a line may have a percent or fixed discount, not both",
    );
  });

  it("rejects a fixed discount above the line subtotal — decision 1A", async () => {
    const res = await addLine(cookieA, docId, {
      description: "X",
      quantity: 1,
      unitPriceCents: 5000,
      discount: { type: "fixed", cents: 8000 },
    });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { message: string }) => d.message)).toContain(
      "fixed discount cannot exceed the line subtotal",
    );
  });

  it("rejects a single line whose subtotal exceeds the Int4 cap", async () => {
    const res = await addLine(cookieA, docId, { description: "X", quantity: 1000000, unitPriceCents: 300000 });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { message: string }) => d.message)).toContain(
      "line subtotal exceeds the supported maximum of $20,000,000",
    );
  });

  it("rejects a document whose TOTALS would overflow Int4", async () => {
    const bigDoc = await createDoc(cookieA, "Overflow");
    const line = { description: "Big", quantity: 1, unitPriceCents: 2_000_000_000 };
    expect((await addLine(cookieA, bigDoc, line)).status).toBe(201);
    const res = await addLine(cookieA, bigDoc, line);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "DOCUMENT_TOO_LARGE" });
  });
});

describe("ownership isolation", () => {
  it("user B cannot see, edit, delete, finalize, or extend user A's document", async () => {
    const docId = await createDoc(cookieA, "Private");
    const attempts = [
      request(app).get(`/api/documents/${docId}`).set("Cookie", cookieB),
      request(app).put(`/api/documents/${docId}`).set("Cookie", cookieB).send({ title: "X", customer: "X", issueDate: "2026-08-08" }),
      request(app).delete(`/api/documents/${docId}`).set("Cookie", cookieB),
      request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieB),
      request(app).post(`/api/documents/${docId}/lines`).set("Cookie", cookieB).send(sampleLines[1]),
      request(app).post(`/api/documents/${docId}/duplicate`).set("Cookie", cookieB).send({ issueDate: "2026-08-08" }),
    ];
    for (const attempt of await Promise.all(attempts)) {
      expect(attempt.status).toBe(404);
    }
  });

  it("list only returns your own documents", async () => {
    await createDoc(cookieB, "B doc");
    const res = await request(app).get("/api/documents").set("Cookie", cookieB);
    expect(res.status).toBe(200);
    for (const doc of res.body.documents) {
      expect(doc.title).not.toBe("Private");
    }
  });
});

describe("lifecycle", () => {
  it("finalizes a draft; EVERY mutation on it then returns 409, including delete", async () => {
    const docId = await buildSampleDoc(cookieA);
    const fin = await request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieA);
    expect(fin.status).toBe(200);
    expect(fin.body.document.status).toBe("finalized");
    const lineId = fin.body.document.lines[0].id;

    const mutations = [
      request(app).put(`/api/documents/${docId}`).set("Cookie", cookieA).send({ title: "X", customer: "X", issueDate: "2026-08-08" }),
      request(app).delete(`/api/documents/${docId}`).set("Cookie", cookieA),
      request(app).post(`/api/documents/${docId}/lines`).set("Cookie", cookieA).send(sampleLines[1]),
      request(app).put(`/api/documents/${docId}/lines/${lineId}`).set("Cookie", cookieA).send(sampleLines[1]),
      request(app).delete(`/api/documents/${docId}/lines/${lineId}`).set("Cookie", cookieA),
    ];
    for (const attempt of await Promise.all(mutations)) {
      expect(attempt.status).toBe(409);
      expect(attempt.body).toMatchObject({ code: "DOCUMENT_FINALIZED", message: "finalized documents cannot be modified" });
    }
  });

  it("finalizing an already-finalized document returns 409 (double-click safety)", async () => {
    const docId = await buildSampleDoc(cookieA);
    await request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieA);
    const again = await request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieA);
    expect(again.status).toBe(409);
  });

  it("defense-in-depth (8A): finalize rejects an invalid row seeded PAST the API", async () => {
    const docId = await createDoc(cookieA, "Tampered");
    // Bypass the API entirely — simulates a bug or manual DB edit.
    await prisma.lineItem.create({
      data: {
        documentId: docId,
        description: "smuggled",
        quantity: 0,
        unitPriceCents: 100,
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
      },
    });
    const res = await request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieA);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CANNOT_FINALIZE");
    expect(res.body.message).toContain('line "smuggled" has quantity 0');
  });
});

describe("duplicate (13A: any status, source untouched)", () => {
  it("duplicates a finalized document into a fresh draft with equal totals and ordered lines", async () => {
    const docId = await buildSampleDoc(cookieA);
    await request(app).post(`/api/documents/${docId}/finalize`).set("Cookie", cookieA);

    const res = await request(app)
      .post(`/api/documents/${docId}/duplicate`)
      .set("Cookie", cookieA)
      .send({ issueDate: "2026-08-09" });
    expect(res.status).toBe(201);
    const copy = res.body.document;
    expect(copy.id).not.toBe(docId);
    expect(copy).toMatchObject({
      title: "Sample (copy)",
      status: "draft",
      issueDate: "2026-08-09",
      subtotalCents: 45000,
      grandTotalCents: 42150,
    });
    expect(copy.lines.map((l: { description: string }) => l.description)).toEqual(["Widget A", "Widget B", "Service fee"]);

    // Source is untouched and still finalized.
    const source = await request(app).get(`/api/documents/${docId}`).set("Cookie", cookieA);
    expect(source.body.document.status).toBe("finalized");
    expect(source.body.document.lines).toHaveLength(3);

    // The copy is a real draft: editable.
    const edit = await addLine(cookieA, copy.id, sampleLines[1]);
    expect(edit.status).toBe(201);
  }, 30000); // ~14 API calls against a remote DB — needs more than the default budget

  it("duplicates a draft too", async () => {
    const docId = await createDoc(cookieA, "Draft original");
    const res = await request(app)
      .post(`/api/documents/${docId}/duplicate`)
      .set("Cookie", cookieA)
      .send({ issueDate: "2026-08-09" });
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe("Draft original (copy)");
  });
});
