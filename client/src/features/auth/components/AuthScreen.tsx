import { useState, type FormEvent } from "react";
import { AuthBrand } from "./AuthBrand";
import type { LoginCredentials, RegistrationCredentials } from "../types";
import {
  getPasswordPolicyError,
  PASSWORD_REQUIREMENTS,
} from "../utils/password";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  error: string | null;
  isSubmitting: boolean;
  onClearError: () => void;
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onRegister: (credentials: RegistrationCredentials) => Promise<void>;
};

export function AuthScreen({
  error,
  isSubmitting,
  onClearError,
  onLogin,
  onRegister,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const isRegistering = mode === "register";

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIdentifier("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
    onClearError();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    onClearError();

    if (isRegistering && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (isRegistering) {
      const passwordError = getPasswordPolicyError(password);

      if (passwordError) {
        setFormError(passwordError);
        return;
      }
    }

    if (isRegistering) {
      await onRegister({
        username: identifier,
        ...(email.trim() ? { email } : {}),
        password,
      });
      return;
    }

    await onLogin({ identifier, password });
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <AuthBrand />

        <div className="auth-heading">
          <h1 id="auth-title">
            {isRegistering ? "Create your account" : "Welcome back"}
          </h1>
          <p>
            {isRegistering
              ? "Choose your sign-in details to get started."
              : "Sign in to continue to your tasks."}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <button
            aria-selected={!isRegistering}
            className={!isRegistering ? "is-active" : ""}
            onClick={() => selectMode("login")}
            role="tab"
            type="button"
          >
            Sign in
          </button>
          <button
            aria-selected={isRegistering}
            className={isRegistering ? "is-active" : ""}
            onClick={() => selectMode("register")}
            role="tab"
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-identifier">
              {isRegistering ? "Username" : "Username or email"}
            </label>
            <input
              autoComplete="username"
              autoFocus
              id="auth-identifier"
              maxLength={isRegistering ? 30 : 254}
              minLength={3}
              onChange={(event) => setIdentifier(event.target.value)}
              pattern={isRegistering ? "[A-Za-z0-9_]+" : undefined}
              placeholder={isRegistering ? "your_username" : "Username or email"}
              required
              type="text"
              value={identifier}
            />
          </div>

          {isRegistering ? (
            <div className="auth-field">
              <label htmlFor="auth-email">Email (optional)</label>
              <input
                autoComplete="email"
                id="auth-email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </div>
          ) : null}

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="auth-password">Password</label>
              {!isRegistering ? (
                <a href="/forgot-password">Forgot password?</a>
              ) : null}
            </div>
            <input
              autoComplete={isRegistering ? "new-password" : "current-password"}
              id="auth-password"
              maxLength={128}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {isRegistering ? (
              <span className="auth-field-hint">{PASSWORD_REQUIREMENTS}</span>
            ) : null}
          </div>

          {isRegistering ? (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <input
                autoComplete="new-password"
                id="auth-confirm-password"
                maxLength={128}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          ) : null}

          {formError || error ? (
            <p className="auth-error" role="alert">
              {formError ?? error}
            </p>
          ) : null}

          <button
            className="primary-button auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegistering
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AuthLoadingScreen() {
  return (
    <main className="auth-shell">
      <div className="auth-loading" role="status">
        <AuthBrand />
        <p>Checking your session...</p>
      </div>
    </main>
  );
}
