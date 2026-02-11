import { AuthLayout } from "../components/AuthLayout";
import { useState } from "react";
import { registerUser } from "../api/auth";

type ApiValidationError = { field?: string; error?: string };
type ApiErrorResponse = { message?: string; errors?: ApiValidationError[] };

type ErrorWithBody = {
  body?: ApiErrorResponse;
  response?: { body?: ApiErrorResponse };
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getApiBody(err: unknown): ApiErrorResponse | undefined {
  if (!isObject(err)) return undefined;

  const body = (err as ErrorWithBody).body;
  if (body && typeof body === "object") return body;

  return undefined;
}

function toFieldErrors(
  body: ApiErrorResponse | undefined,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of body?.errors ?? []) {
    const field = e.field?.trim();
    const msg = e.error?.trim();
    if (!field || !msg) continue;
    (out[field] ??= []).push(msg);
  }
  return out;
}

export function RegisterPage({ onGoLogin }: { onGoLogin: () => void }) {

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [done, setDone] = useState(false);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }

  function FieldError({ name }: { name: string }) {
    const msgs = fieldErrors[name];
    if (!msgs?.length) return null;
    return (
      <div style={{ marginTop: 6 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ color: "crimson", fontSize: 12 }}>
            {m}
          </div>
        ))}
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});
    setDone(false);

    try {
      await registerUser({
        email,
        username,
        password,
        rePassword,
      });
      setDone(true);
    } catch (err: unknown) {
      console.log("RAW ERROR:", err);

      const body = getApiBody(err);

      if (body?.errors?.length) {
        setFormError(body.message ?? "Validation failed");
        setFieldErrors(toFieldErrors(body));
      } else {
        const msg = err instanceof Error ? err.message : "Register failed";
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

    return (
    <AuthLayout appName="Chat App">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>
        <p className="auth-subtitle">
          Create an account to start chatting.
        </p>

        {formError && <div className="alert alert-danger">{formError}</div>}

        {done && (
          <div className="alert alert-ok">
            Account created successfully.
            <div className="divider" />
            <button className="link" type="button" onClick={onGoLogin}>
              Go to login
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder="email address"
              required
            />
            <FieldError name="email" />
          </div>

          <div className="field">
            <label>Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              placeholder="username"
              required
            />
            <FieldError name="username" />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              placeholder="••••••••"
              required
            />
            <FieldError name="password" />
          </div>

          <div className="field">
            <label>Repeat password</label>
            <input
              className="input"
              type="password"
              value={rePassword}
              onChange={(e) => {
                setRePassword(e.target.value);
                clearFieldError("rePassword");
              }}
              placeholder="••••••••"
              required
            />
            <FieldError name="rePassword" />
          </div>

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="row">
            <span className="small">Already have an account?</span>
            <button className="btn btn-ghost" type="button" onClick={onGoLogin}>
              Log in
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
