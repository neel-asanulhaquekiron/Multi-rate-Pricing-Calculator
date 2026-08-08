import { vi } from "vitest";

export interface MockRoute {
  method: string;
  path: string | RegExp;
  status: number;
  body: unknown;
}

export interface RecordedCall {
  method: string;
  path: string;
  body: unknown;
}

/**
 * Stubs global fetch with scripted responses and records every call so tests
 * can assert on the exact payloads the UI sends.
 */
export const mockFetch = (routes: MockRoute[]): { calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      const method = init?.method ?? "GET";
      calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });

      const route = routes.find(
        (candidate) =>
          candidate.method === method &&
          (typeof candidate.path === "string" ? candidate.path === path : candidate.path.test(path)),
      );
      if (!route) {
        return new Response(JSON.stringify({ code: "NOT_FOUND", message: `no mock for ${method} ${path}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(route.body), {
        status: route.status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );

  return { calls };
};
