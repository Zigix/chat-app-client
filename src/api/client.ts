import type { ApiErrorResponse } from "./auth";
import { ApiHttpError } from "./normalizeError";

async function readErrorBody(res: Response): Promise<ApiErrorResponse | undefined> {
  const ct = res.headers.get("content-type") || "";

  try {
    if (ct.includes("application/json")) {
      return (await res.json()) as ApiErrorResponse;
    }
    const txt = await res.text();
    return txt ? { message: txt } : undefined;
  } catch {
    return undefined;
  }
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${"http://localhost:8080/"}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiHttpError(res.status, body);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;

  return (await res.json()) as T;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`http://localhost:8080/api${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      body?.message || body?.error || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

