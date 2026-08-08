import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { prisma } from "../db";

const runId = `test-rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "correct-horse-9";

let cookie = "";
let cookieOther = "";
const docIds: string[] = [];

const signup = async (label: string): Promise<string> => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email: `${runId}-${label}@example.com`, password: PASSWORD });
  expect(res.status).toBe(201);
  return ([] as string[]).concat(res.headers["set-cookie"])[0].split(";")[0];
};

const createDoc = async (ck: string, issueDate: string, title: string): Promise<string> => {
  const res = await request(app)
    .post("/api/documents")
    .set("Cookie", ck)
    .send({ title, customer: "Acme", issueDate });
  expect(res.status).toBe(201);
  return res.body.document.id;
};

const addLine = async (ck: string, docId: string, line: object): Promise<request.Response> => {
  return request(app).post(`/api/documents/${docId}/lines`).set("Cookie", ck).send(line);
};

const summary = async (ck: string, from: string, to: string): Promise<request.Response> => {
  return request(app).get(`/api/reports/summary?from=${from}&to=${to}`).set("Cookie", ck);
};

/**
 * Fixture (user A):
 *   2025-12-31  "before"    — outside (day before 'from' boundary)
 *   2026-01-01  "start"     — ON the from boundary, has a line, gets EDITED
 *   2026-01-15  "mid"       — in range, finalized (drafts AND finalized both count)
 *   2026-01-31  "end"       — ON the to boundary
 *   2026-02-01  "after"     — outside
 * User B gets one in-range doc that must NOT leak into A's report.
 */
beforeAll(async () => {
  cookie = await signup("main");
  cookieOther = await signup("other");

  const before = await createDoc(cookie, "2025-12-31", "before");
  const start = await createDoc(cookie, "2026-01-01", "start");
  const mid = await createDoc(cookie, "2026-01-15", "mid");
  const end = await createDoc(cookie, "2026-01-31", "end");
  const after = await createDoc(cookie, "2026-02-01", "after");
  docIds.push(before, start, mid, end, after);

  // "start": add a line, then EDIT it — the report must reflect the edit.
  const added = await addLine(cookie, start, { description: "W", quantity: 1, unitPriceCents: 10000, taxBp: 500 });
  const lineId = added.body.document.lines[0].id;
  await request(app)
    .put(`/api/documents/${start}/lines/${lineId}`)
    .set("Cookie", cookie)
    .send({ description: "W", quantity: 3, unitPriceCents: 10000, discount: { type: "percent", bp: 1000 }, taxBp: 500 });

  // "mid": line + finalize.
  await addLine(cookie, mid, { description: "S", quantity: 1, unitPriceCents: 20000, discount: { type: "fixed", cents: 2000 } });
  await request(app).post(`/api/documents/${mid}/finalize`).set("Cookie", cookie);

  // Boundary docs get a small line each; outsiders stay empty (their totals
  // must not matter anyway).
  await addLine(cookie, end, { description: "E", quantity: 2, unitPriceCents: 5000 });
  await addLine(cookie, before, { description: "B", quantity: 1, unitPriceCents: 99999 });

  await createDoc(cookieOther, "2026-01-10", "other-user-doc");
}, 60000);

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await prisma.$disconnect();
});

describe("GET /api/reports/summary", () => {
  it("matches the sum of individual documents in range — inclusive boundaries, edits reflected, both statuses", async () => {
    const res = await summary(cookie, "2026-01-01", "2026-01-31");
    expect(res.status).toBe(200);

    // Independent source of truth: sum the individual GET responses.
    const inRange = [docIds[1], docIds[2], docIds[3]]; // start, mid, end
    let grand = 0;
    let tax = 0;
    let discount = 0;
    for (const id of inRange) {
      const doc = await request(app).get(`/api/documents/${id}`).set("Cookie", cookie);
      grand += doc.body.document.grandTotalCents;
      tax += doc.body.document.taxCents;
      discount += doc.body.document.discountCents;
    }

    expect(res.body.summary).toEqual({
      documentCount: 3,
      grandTotalCents: grand,
      taxCents: tax,
      discountCents: discount,
    });
    // The edited line (3 x 100 -10% +5% = 283.50) must be what's counted.
    expect(grand).toBe(28350 + 18000 + 10000);
  }, 30000);

  it("returns zeros (not nulls) for an empty range", async () => {
    const res = await summary(cookie, "2001-01-01", "2001-12-31");
    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({ documentCount: 0, grandTotalCents: 0, taxCents: 0, discountCents: 0 });
  });

  it("a single-day range hits exactly the boundary document", async () => {
    const res = await summary(cookie, "2026-01-31", "2026-01-31");
    expect(res.body.summary.documentCount).toBe(1);
    expect(res.body.summary.grandTotalCents).toBe(10000);
  });

  it("rejects from > to with a specific message", async () => {
    const res = await summary(cookie, "2026-02-01", "2026-01-01");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("'from' must be on or before 'to'");
  });

  it("rejects missing or malformed dates", async () => {
    const missing = await request(app).get("/api/reports/summary?from=2026-01-01").set("Cookie", cookie);
    expect(missing.status).toBe(400);
    const malformed = await summary(cookie, "01/01/2026", "2026-01-31");
    expect(malformed.status).toBe(400);
    expect(malformed.body.message).toBe("issue date must be a real date in YYYY-MM-DD format");
  });

  it("never counts another user's documents", async () => {
    const res = await summary(cookieOther, "2026-01-01", "2026-01-31");
    expect(res.body.summary.documentCount).toBe(1); // only their own
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/reports/summary?from=2026-01-01&to=2026-01-31");
    expect(res.status).toBe(401);
  });

  it("status=finalized counts only finalized documents", async () => {
    const res = await request(app)
      .get("/api/reports/summary?from=2026-01-01&to=2026-01-31&status=finalized")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    // Only "mid" is finalized: 1 x 200.00 - $20 fixed = 180.00
    expect(res.body.summary).toEqual({
      documentCount: 1,
      grandTotalCents: 18000,
      taxCents: 0,
      discountCents: 2000,
    });
  });

  it("rejects an unknown status value with a specific message", async () => {
    const res = await request(app)
      .get("/api/reports/summary?from=2026-01-01&to=2026-01-31&status=draft")
      .set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('status must be "all" or "finalized"');
  });
});
