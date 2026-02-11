import type { ApiErrorResponse } from "./auth";

export type NormalizedError = {
  status?: number;
  formMessage: string;
  fieldErrors: Record<string, string[]>;
};

function toFieldErrors(body?: ApiErrorResponse): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of body?.errors ?? []) {
    const field = e.field?.trim();
    const msg = e.error?.trim();
    if (!field || !msg) continue;
    (out[field] ??= []).push(msg);
  }
  return out;
}

export class ApiHttpError extends Error {
  status: number;
  body?: ApiErrorResponse;
  constructor(status: number, body?: ApiErrorResponse, fallback = `HTTP ${status}`) {
    super(body?.message || fallback);
    this.status = status;
    this.body = body;
  }
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ApiHttpError) {
    return {
      status: err.status,
      formMessage: err.body?.message || err.message || `HTTP ${err.status}`,
      fieldErrors: toFieldErrors(err.body),
    };
  }

  if (err instanceof Error) {
    return { formMessage: err.message || "Unknown error", fieldErrors: {} };
  }

  return { formMessage: "Unknown error", fieldErrors: {} };
}