/**
 * Typed API client — the only place the frontend talks to the network.
 *
 *   request() ── fetch(credentials: include) ──▶ /api/*
 *        │                                        │
 *        │◀── ok: parsed JSON                     │
 *        └──▶ error: throws ApiError { status, code, message, details }
 *                       │
 *                       └── 401 → onUnauthorized() (auth context clears the
 *                           user; RequireAuth redirects to /login)
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered once by the auth provider; fires on any 401 from the API. */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  onUnauthorized = handler;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    credentials: "include",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (proxy error page etc.) — fall through to the throw below.
  }

  if (!res.ok) {
    const err = body as { code?: string; message?: string; details?: ApiErrorDetail[] } | null;
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? `request failed with status ${res.status}`,
      err?.details,
    );
  }

  return body as T;
};

export const api = {
  get: <T>(path: string): Promise<T> => {
    return request<T>(path);
  },
  post: <T>(path: string, body?: unknown): Promise<T> => {
    return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  put: <T>(path: string, body: unknown): Promise<T> => {
    return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete: <T>(path: string): Promise<T> => {
    return request<T>(path, { method: "DELETE" });
  },
};
