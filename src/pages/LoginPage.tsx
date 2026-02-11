import { useState } from "react";
import { loginUser }from '../api/auth';
import { AuthLayout } from "../components/AuthLayout";
import { recoverSessionKeys } from "../crypto/webcrypto";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

type Props = {
  onGoRegister: () => void;
  onLoggedIn: (username: string) => void;
};

export function LoginPage({ onGoRegister, onLoggedIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginUserResponse = await loginUser({ username, password });
      console.log("Login response:", loginUserResponse);
      localStorage.setItem(ACCESS_TOKEN_KEY, loginUserResponse.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, loginUserResponse.refreshToken);

      const vault = loginUserResponse.vaultDto;
      const keys = await recoverSessionKeys(password, vault);
      console.log("Recovered session keys:", keys);

      onLoggedIn(username);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout appName="Chat App">
      <div className="auth-card">
        <h2 className="auth-title">Log in</h2>
        <p className="auth-subtitle">
          Log in to continue.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "" : "Log in"}
          </button>

          <div className="row">
            <span className="small">Don't have an account?</span>
            <button className="btn btn-ghost" type="button" onClick={onGoRegister}>
              Register
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
