import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { prisma } from "../db";

/**
 * Integration tests against the real API + database. Every test user's email
 * is namespaced with a unique run id, and afterAll deletes exactly that
 * namespace — the suite leaves no residue.
 */
const runId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = (label: string): string => `${runId}-${label}@example.com`;
const PASSWORD = "correct-horse-9";

const cookieOf = (res: request.Response): string => {
  const cookies = res.headers["set-cookie"];
  expect(cookies, "expected a Set-Cookie header").toBeDefined();
  return ([] as string[]).concat(cookies)[0].split(";")[0];
};

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await prisma.$disconnect();
});

describe("POST /api/auth/signup", () => {
  it("creates an account, sets an httpOnly session cookie, returns the user", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: email("signup"), password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: email("signup") });
    expect(res.body.user.id).toBeTruthy();
    const rawCookie = ([] as string[]).concat(res.headers["set-cookie"])[0];
    expect(rawCookie).toMatch(/^token=/);
    expect(rawCookie).toMatch(/HttpOnly/i);
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email with 409 EMAIL_TAKEN", async () => {
    await request(app).post("/api/auth/signup").send({ email: email("dup"), password: PASSWORD });
    const res = await request(app).post("/api/auth/signup").send({ email: email("dup"), password: PASSWORD });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("treats email as case-insensitive (stored lowercased)", async () => {
    await request(app).post("/api/auth/signup").send({ email: email("case").toUpperCase(), password: PASSWORD });
    const res = await request(app).post("/api/auth/login").send({ email: email("case"), password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it("rejects a weak password with a specific message", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: email("weak"), password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.message).toBe("password must be at least 8 characters");
  });

  it("rejects a malformed email with a specific message", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "not-an-email", password: PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.details).toContainEqual({ field: "email", message: "enter a valid email address" });
  });

  it("rejects a missing body with 400, not 500", async () => {
    const res = await request(app).post("/api/auth/signup").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("rejects a wrong password with the constant-shape 401", async () => {
    await request(app).post("/api/auth/signup").send({ email: email("login"), password: PASSWORD });
    const res = await request(app).post("/api/auth/login").send({ email: email("login"), password: "wrong-password-1" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "INVALID_CREDENTIALS", message: "invalid email or password" });
  });

  it("rejects an unknown email with the IDENTICAL response (no account enumeration)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: email("ghost"), password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "INVALID_CREDENTIALS", message: "invalid email or password" });
  });

  it("logs in and the returned cookie authenticates /me", async () => {
    await request(app).post("/api/auth/signup").send({ email: email("me"), password: PASSWORD });
    const login = await request(app).post("/api/auth/login").send({ email: email("me"), password: PASSWORD });
    expect(login.status).toBe(200);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookieOf(login));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email("me"));
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a request without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("rejects a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "token=not.a.real.jwt");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the cookie so /me stops authenticating", async () => {
    const signup = await request(app).post("/api/auth/signup").send({ email: email("out"), password: PASSWORD });
    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookieOf(signup));
    expect(logout.status).toBe(204);

    const cleared = ([] as string[]).concat(logout.headers["set-cookie"])[0];
    expect(cleared).toMatch(/^token=;/);
  });
});

describe("unknown API route", () => {
  it("returns JSON 404, not an HTML page", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "NOT_FOUND" });
  });
});
